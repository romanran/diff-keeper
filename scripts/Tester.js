const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const path = require('path');
const imageDiff = require('image-diff');
const assert = require('assert');
const phantomjs = require('phantomjs');
const webdriver = require('selenium-webdriver');

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

class Tester {
	constructor(project) {
		this.project = project;
		this.valid = false;
		if (_.has(this.project, 'browsers') && _.has(this.project, 'resolutions') && _.has(this.project, 'pages')) {
			this.browsers = this.project.browsers;
			this.resolutions = this.project.resolutions;
			this.pages = this.project.pages;
			this.valid = true;
		}
		this.tasks = [];
		this.time = moment().format('YYYY-MM-D HH-mm');
		fs.ensureDir(screenshots_dir);
		this.results_for_tests = [];
	}

	run() {
		const q = promise();
		const project = this.project;
		describe('Project test', function () {
			it('project has necessary info', function () {
				return assert.ok(_.has(project, 'browsers') && _.has(project, 'resolutions') && _.has(project, 'pages'));
			});
		});
		if (!(_.has(this.project, 'browsers') && _.has(this.project, 'resolutions') && _.has(this.project, 'pages'))) {
			q.reject(assert(0, 'Invalid project file'));
		}

		_.forEach(this.browsers, (browser) => {
			this.tasks.push(this.startBrowser.bind(this, browser));
			_.forEach(this.pages, (page) => {
				_.forEach(this.resolutions, (resolution) => {
					// this.tasks.push(this.setResolution.bind(this, resolution));
					this.tasks.push(this.processTests.bind(this, page, resolution, browser));
				});
			});
			this.tasks.push(this.killBrowser.bind(this, browser));
		});
		const tasks = this.tasks;
		async.series(tasks, function (err, data) {
			deb('ran tasks');
			if (err) {
				return q.reject(err);
			}
			//console.log('err async: ', err, 'data async: ', data);
			return q.resolve(data);
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
		deb('killing it');
		this.driver.quit().then((err, data) => {
			_.unset(this, 'driver');
			done(err);
		});
	}

	handleTestError(err) {
		if (!_.isEmpty(err)){
			if (_.has(err, 'message')) {
				err = err.message;
			}
			this.results_for_tests.errors.push(err);
		}
	}

	processTests(page, resolution, browser, all_done) {
		const driver = this.driver;
		let tasks = [];
		const results = {
			nominal: {
				page: {
					name: page.name,
					url: page.url
				},
				window: {
					resolution: {
						width:resolution.width,
						height: resolution.height
					}
				},
				browser: browser
			},
			errors: []
		};
		tasks.push(
			done => {
				driver.manage().window().setSize(resolution.width, resolution.height).then(err => {
					const size = driver.manage().window().getSize();
					_.set(results, 'window.resolution.width',size[0]);
					_.set(results, 'window.resolution.height', size[1]);
					done();
					this.handleTestError(err);
				});
			}, (done) => {
				return driver.get(page.url).then((err, data) => {
					deb('received data from ',page.url, data);
					this.handleTestError(err);
					setTimeout(() => {
						return done(null);
					}, 3000);
				});
			}
		);
		_.forEach(page.elements, (element) => {
			tasks.push(done => {
				return driver.findElement(webdriver.By[element.by](element.selector)).then(function (webElement) {
					if (webElement) {
						return done(null);
					}
					this.handleTestError(`${element.selector} not found`);
					return done(null);
				}, function (err) {
					this.handleTestError(err);
					return done(null);
				});
			});
		});
		tasks.push(done => {
			return this.processScreenshots(page.name, resolution, browser).then((result) =>{
				//console.log(result);
				if (result.message) {
					deb(result.message);
				}
				done(null, result);
			}).catch(err => {
				this.handleTestError(err);
				done(null);
			});
		});

		async.series(tasks, (err, data) => {
			this.results_for_tests.push(results);
			this.handleTestError(err);
			all_done(err, data);
		});
	}

	processScreenshots(name, resolution, browser) {
		const driver = this.driver;
		const q = promise();
		name = _.kebabCase(name);
		const tasks = [
			(done) => {
				this.preparePaths(this.project.name, resolution, browser).then(paths => done(null, paths)).catch(done);
			},
			(paths, done) => {
				console.log(paths);
				setTimeout(() => done(null, paths), 8000);
			},
			(paths, done) => {
				driver.saveScreenshot(`${paths.curr}/${name}.png`, driver).then(data => done(null, paths));
			}
		];
		async.waterfall(tasks, (err, file_paths) => {
			if (err) {
				return q.reject(err);
			}
			if (!fs.existsSync(`${file_paths.prev}/${name}.png`)) {
				return q.resolve({
					message: 'No previous file'
				});
			}
			imageDiff.getFullResult({
				actualImage: `${file_paths.curr}/${name}.png`,
				expectedImage: `${file_paths.prev}/${name}.png`,
				diffImage: `${file_paths.curr}/${name}_difference.png`,
				shadow: true
			}, function (err, result) {
				if (err) return q.reject(err);
				return q.resolve(result);
			});
		});

		return q.q;
	}

	preparePaths(project, resolution, browser) {
		const q = promise();
		const prev_date = this.getLastFile(`screenshots/${project}/`);
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
	}

	getLastFile(dir) {
		const files = fs.readdirSync(path.resolve(dir));
		return _.max(files, (f) => {
			const fullpath = path.join(dir, f);
			return fs.statSync(fullpath).ctime;
		});
	}
}

module.exports = Tester;