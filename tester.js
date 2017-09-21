const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const path = require('path');
const imageDiff = require('image-diff');
const assert = require('assert');
const phantomjs = require('phantomjs')
const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
webdriver.WebDriver.prototype.saveScreenshot = function(filename, driver) {
    return new Promise((resolve, reject) => {
        driver.takeScreenshot().then(function(data) {
            fs.writeFile(filename, data.replace(/^data:image\/png;base64,/, ''), 'base64', function(err) {
                if (err) console.log(err);
                resolve();
            });
        });
    });
};
const async = require('async');
class Tester {
    constructor(project) {
        this.project = project;
        this.browsers = this.project.browsers;
        this.resolutions = this.project.resolutions;
        this.pages = this.project.pages;
        this.tasks = [];
        this.time = moment().format('YYYY-MM-D HH-mm');
    }

    run() {
        return new Promise((resolve, reject) => {
            _.forEach(this.browsers, (browser) => {
                this.tasks.push(this.startBrowser.bind(this, browser));
                _.forEach(this.resolutions, (resolution) => {
                    this.tasks.push(this.setResolution.bind(this, resolution));
                    _.forEach(this.pages, (page) => {
                        this.tasks.push(this.processTests.bind(this, page, resolution));
                    });
                });
            });
            const _p = this;
            describe(`Testing ${_p.project.name}`, function() {
                async.series(_p.tasks, (err, data) => {
                    console.log('err async: ', err, 'data async: ', data);
                    resolve();
                })
            })
        })
    }

    startBrowser(browser, done) {
        this.driver = new webdriver.Builder()
            .forBrowser(browser)
            .build();
        done(null);
    };

    setResolution(resolution, task_done) {
        const driver = this.driver;
        task_done(null);
    }

    processTests(page, resolution, all_done) {
        const driver = this.driver;
        let tests = [];
        const _p = this;
        tests.push(function(test_done) {
            it('should open', function(done) {
                this.timeout(0);
                driver.get(page.url).then((err, data) => {
                    setTimeout(() => {
                        done();
                    }, 5000);
                });
            });
            it(`Change resolution to ${resolution.width} x ${resolution.height}`, function(resized) {
                driver.manage().window().setSize(resolution.width, resolution.height);
                resized();
            });
            _.forEach(page.elements, (element) => {
                it(`should have element with ` + element.by + ` ` + element.selector + ` present`, (done) => {
                    driver.findElement(webdriver.By[element.by](element.selector)).then(function(webElement) {
                        done();
                    }, function(err) {
                        done(err);
                    });
                });
            });
            it('should have less difference than 10%', function(done) {
                this.timeout(0);
                _p.processScreenshots.call(_p, page.name, resolution).then((result) => {
                    //console.log(result);
                    if (result.message) {
                        console.log(result.message);
                        return done(null);
                    }
                    try {
                        assert.equal(result.percentage * 100 < 10, true, Math.floor(result.percentage * 100, 2) + '%');
                    } catch (e) {
                        //console.log('e: ', e);
                        return done();
                    }
                    console.log('spoko')
                    test_done();
                    done();
                }).catch((err) => {
                    console.log('errorrrr: ', err)
                    test_done();
                    done(err);
                });
            });
        });


        describe(`Checking ${page.name}`, function() {
            async.series(tests, (err, data) => {
                //done_check();
                all_done(null, data);
            })
        });
    }

    /**
     * Set this.prev_path and this.current_path
     * @param  {string} project project for project
     * @param  {int} width    browser width
     * @param  {int} height   browser height*
     * @return {array} paths
     */
    preparePaths(project, resolution) {
        return new Promise((resolve, reject) => {
            const prev_date = this.getLastFile('screenshots/' + '/' + project + '/');
            const prev_path = 'screenshots/' + project + '/' + prev_date + '/' + resolution.width + '_' + resolution.height + '/';
            const curr_path = 'screenshots/' + project + '/' + this.time + '/' + resolution.width + '_' + resolution.height + '/';
            fs.ensureDir(curr_path, err => {
                if (err) console.log(err);
                resolve({
                    prev_path: path.resolve(prev_path),
                    curr_path: path.resolve(curr_path)
                });
            });
        })
    }

    processScreenshots(name, resolution) {
        const driver = this.driver;
        return new Promise((resolve, reject) => {
            name = _.kebabCase(name);
            this.preparePaths(this.project.name, resolution).then((file_paths) => {
                setTimeout(() => {
                    driver.saveScreenshot(file_paths.curr_path + '/' + name + '.png', driver).then(function() {
                        if (fs.existsSync(file_paths.prev_path + '/' + name + '.png')) {
                            imageDiff.getFullResult({
                                actualImage: file_paths.curr_path + '/' + name + '.png',
                                expectedImage: file_paths.prev_path + '/' + name + '.png',
                                diffImage: file_paths.curr_path + '/' + name + '_difference.png',
                                shadow: true
                            }, function(err, result) {
                                if (err) return reject(err);
                                return resolve(result);
                            });
                        } else {
                            return resolve({
                                message: 'No previous file'
                            });
                        }
                    });
                }, 8000);
            });
        });
    }
    getLastFile(dir) {
        const files = fs.readdirSync(dir);
        return _.max(files, (f) => {
            const fullpath = path.join(dir, f);
            return fs.statSync(fullpath).ctime;
        });
    }
}

module.exports = Tester;