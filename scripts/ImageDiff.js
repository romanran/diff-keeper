const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const path = require('path');
const imageDiff = require('image-diff');
const assert = require('assert');
const phantomjs = require('phantomjs');
const webdriver = require('selenium-webdriver');
const Test = require('./Test');

const promise = function () {
	let resolve, reject;
	let q = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return {q: q, resolve: resolve, reject: reject};
};

webdriver.WebDriver.prototype.saveScreenshot = function (filename, driver) {
	return new Promise((resolve, reject) => {
		driver.takeScreenshot().then(function (data) {
			fs.writeFile(filename, data.replace(/^data:image\/png;base64,/, ''), 'base64', function (err) {
				if (err) console.log(err);
				resolve();
			});
		});
	});
};

const async = require('async');
const screenshots_dir = path.resolve('./screenshots');

class ImageDiff {
	constructor(project) {
		this.project = project;
		this.valid = false;
		if (_.has(this.project, 'browsers') && _.has(this.project, 'resolutions') && _.has(this.project, 'pages')) {
			this.browsers = this.project.browsers;
			this.resolutions = this.project.resolutions;
			this.pages = this.project.pages;
			this.valid = true;
		}
		this.tests = [];
		this.tasks = [];
		this.time = moment().format('YYYY-MM-D HH-mm');
		fs.ensureDir(screenshots_dir);
	}

	run() {
		const q = promise();
		const project = this.project;
		if (!(_.has(this.project, 'browsers') && _.has(this.project, 'resolutions') && _.has(this.project, 'pages'))) {
			q.reject(assert(0, 'Invalid project file'));
			return q.q;
		}

		_.forEach(this.browsers, (browser) => {
			this.tasks.push(this.startBrowser.bind(this, browser));
			_.forEach(this.resolutions, (resolution) => {
				_.forEach(this.pages, (page) => {
					this.tasks.push(this.processTests.bind(this, page, resolution, browser));
				});
			});
			this.tasks.push(this.killBrowser.bind(this, browser));
		});
		const tasks = this.tasks;
		async.series(tasks, err => {
			if (err) {
				return q.reject(err);
			}
			//console.log('err async: ', err, 'data async: ', data);
			return q.resolve();
		});
		return q.q;
	}

	startBrowser(browser, done) {
		this.driver = new webdriver.Builder()
			.forBrowser(browser)
			.build();
		done();
	}

	killBrowser(browser, done) {
		this.driver.close();
		this.driver.quit().then(done);
	}

	handleError(err) {
		if (!_.isEmpty(err)) {
			if (_.has(err, 'message')) {
				err = err.message;
			}
			console.log(err);
			return err;
		}
		return !!0;
	}

	processTests(page, resolution, browser, all_done) {
		const driver = this.driver;
		let tasks = [];
		const test = new Test(page, resolution, browser);
		this.tests.push(test);
		tasks.push(
			done => {
				// set resolution
				driver.manage().window().setSize(resolution.width, resolution.height).then(err => {
					done();
					this.handleError(err);
				});
			}, (done) => {
				// open the url
				return driver.get(page.url).then((err) => {
					this.handleError(err);
					setTimeout(() => {
						return done(null);
					}, 3000);
				});
			}
		);
		_.forEach(page.elements, (element) => {
			tasks.push(done => {
				return driver.findElement(webdriver.By[element.by](element.selector)).then((webElement) => {
					element.found = webElement;
					test.set('dom_elements', []);
					test.add('dom_elements', element);
					return done(null);
				}, (err) => {
					this.handleError(err);
					return done(null);
				});
			});
		});
		tasks.push(done => {
			// save screenshots and
			return this.processScreenshots(page.name, resolution, browser, test).then((result) => {
				//console.log(result);
				const size = driver.manage().window().getSize();
				test.set('resolution', size);
				if (result.message) {
					deb(result.message);
				}
				test.set('diff', result);
				done(null);
			}).catch(err => {
				this.handleError(err);
				done(null);
			});
		});

		async.series(tasks, err => {
			this.handleError(err);
			all_done(err);
		});
	}

	processScreenshots(name, resolution, browser) {
		const driver = this.driver;
		const q = promise();
		name = _.kebabCase(name);
		const tasks = [
			(done) => {
				//create folder
				this.preparePaths(this.project.name, resolution, browser).then(paths => done(null, paths)).catch(done);
			},
			(paths, done) => {
				// wait for the pages to load
				setTimeout(() => done(null, paths), 1000);
			},
			(paths, done) => {
				//save screenshot
				driver.saveScreenshot(`${paths.curr}/${name}.png`, driver).then(data => done(null, paths));
			},
			(file_paths, done) => {
				// get image diff
				if (!fs.existsSync(`${file_paths.prev}/${name}.png`)) {
					return done({
						message: 'No previous file'
					});
				}
				imageDiff.getFullResult({
					actualImage: `${file_paths.curr}/${name}.png`,
					expectedImage: `${file_paths.prev}/${name}.png`,
					diffImage: `${file_paths.curr}/${name}_difference.png`,
					shadow: true
				}, (err, result) => done(null, result));
			}
		];
		async.waterfall(tasks, (err, result, g) => {
			if (err) {
				return q.reject(err);
			}
			return q.resolve(result);
		});

		return q.q;
	}

	preparePaths(project, resolution, browser) {
		const q = promise();
		this.getLastFile(`${screenshots_dir}/${project}/`).then(prev_date => {
			const paths = {
				prev: path.resolve(`${screenshots_dir}/${project}/${prev_date}/${resolution.width}_${resolution.height}/${browser}/`),
				curr: path.resolve(`${screenshots_dir}/${project}/${this.time}/${resolution.width}_${resolution.height}/${browser}/`)
			};
			fs.ensureDir(paths.curr, err => {
				if (err) {
					return q.reject(err);
				}
				return q.resolve(paths);
			});
		});
		return q.q;
	}

	getLastFile(dir) {
		return new Promise((resolve, reject) => {
			fs.readdir(path.resolve(dir), (err, files) => {
				if (err) {
					return resolve(null);
				}
				const time = _.max(files, (f) => {
					const fullpath = path.join(dir, f);
					return fs.statSync(fullpath).ctime;
				});
				resolve(time);
			});
		});
	}
}

module.exports = ImageDiff;