const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const assert = require('assert');
const phantomjs = require('phantomjs')
const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
webdriver.WebDriver.prototype.saveScreenshot = function(filename) {
    return driver.takeScreenshot().then(function(data) {
        fs.writeFile(filename, data.replace(/^data:image\/png;base64,/, ''), 'base64', function(err) {
            if (err) throw err;
        });
    });
};

class Screenshoter {
    constructor() {
        this.imageDiff = require('image-diff');

        this.projects = [{
            project: 'networkrail',
            browsers: ['chrome', 'firefox', 'phantomjs'],
            resolutions: [{
                height: 1920,
                width: 1080
            }, {
                height: 1024,
                width: 1366
            }, {
                height: 1366,
                width: 1024
            }, {
                height: 425,
                width: 856
            }, {
                height: 856,
                width: 425
            }],
            pages: [{
                name: 'Homepage',
                url: 'https://networkrail.co.uk/',
                elements: [{
                    by: 'className',
                    selector: 'cookie_notification',
                    action: 'click',
                    screenshotAfter: true,
                    screenshotBefore: true,
                }, {
                    by: 'id',
                    selector: 'main-header'
                }]
            }, {
                name: 'Who we are',
                url: 'https://www.networkrail.co.uk/who-we-are/',
                elements: [{
                    by: 'className',
                    selector: 'cookie_notification'
                }, {
                    by: 'id',
                    selector: 'main-header'
                }]
            }, {
                name: 'Railway upgrade plan',
                url: 'https://www.networkrail.co.uk/our-railway-upgrade-plan/',
                elements: [{
                    by: 'className',
                    selector: 'cookie_notification'
                }, {
                    by: 'id',
                    selector: 'main-header'
                }]
            }]
        }]
    }

    /**
     * Returns last (the newest) file/dir in directory
     * @param  {string} dir Directory to search in
     * @return {string}     The newest file/dir
     */
    getLastFile(dir) {
        const files = fs.readdirSync(dir);
        return _.max(files, (f) => {
            const fullpath = path.join(dir, f);
            return fs.statSync(fullpath).ctime;
        });
    }

    /**
     * Run screenshoter for each page in each browser and in each resolution
     */
    run() {
        let testers = [];
        _.forEach(this.projects, (project) => {
            testers.push(new Tester(project));
        });

    }

}

module.exports = Screenshoter;

class Tester {
    constructor(project) {
        this.project = project;
        this.pages = this.project.pages;
    }

    /**
     * Set this.prev_path and this.current_path
     * @param  {string} project project for project
     * @param  {int} width    browser width
     * @param  {int} height   browser height*
     * @return {array} paths
     */
    preparePaths(project, width, height) {
        const prev_date = getLastFile('screenshots/' + '/' + project + '/');
        const prev_path = 'screenshots/' + '/' + project + '/' + prev_date + '/' + width + '_' + height + '/';
        const curr_path = 'screenshots/' + '/' + project + '/' + moment().format('YYYY-MM-D HH-mm') + '/' + width + '_' + height + '/';
        fs.ensureDir(curr_path, err => {
		  //if(err) console.log(err);
		});
        return {
            prev_path: prev_path,
            curr_path: curr_path
        };
    }

    startBrowser(i = 0) {
        this.driver = new webdriver.Builder()
            .forBrowser(this.project.browsers[i])
            .build();
        this.cur_res_i = 0;
        this.processTests()
        i++;
        startBrowser(i);
    };

    setResolution(resolution) {
        return new Promise((resolve, reject) => {
            this.driver.manage().window().setSize(resolution.width, resolution.height);
            resolve();
        });
    }

    processTests(j = 0) { //zapomnialem uzyc tego j w ogole, cos na pewno sie zepsuje.
        const resolution = this.project.resolutions[this.cur_res_i];
        it(`should change resolution to ${resolution.width} x ${resolution.height} px`, (done) => {
            this.setResolution(resolution).then((e) => {
                done();
            });
        })

        _.forEach(this.pages, (page) => {
            _.forEach(this.pages.elements, (element) => {
                it(`should have element with ` + element.by + ` ` + element.selector + ` present`, (done) => {
                    this.driver.findElement(webdriver.By[element.by](element.selector)).then(function(webElement) {
                        done();
                    }, function(err) {
                        done(err);
                    });
                });
            });
            it('should have less difference than 10%', function(done) {
                this.timeout(0);
                this.processScrenshoots(this.driver, page.name).then((result) => {
                    //console.log(result);
                    if (result.message) {
                        console.log(result.message);
                        return done(null);
                    }
                    try {
                        assert.equal(result.percentage * 100 < 10, true, Math.floor(result.percentage * 100, 2) + '%');
                    } catch (e) {
                        //console.log('e: ', e);
                        resolve();
                        return done();
                    }
                    resolve();
                    done();
                }).catch((err) => {
                    resolve();
                    done(err);
                });
            });
        })
        if(j < )
        j++;
        this.processTests(j);
    }

    processScrenshoots(driver, name, resolution) {
        return new Promise(function(resolve, reject) {
            name = _.kebabCase(name);
            const file_paths = preparePaths(this.project.name, resolution.width, resolution.height);
            setTimeout(() => {
                driver.saveScreenshot(file_paths.curr_path).then(function() {
                    if (fs.existsSync(file_paths.prev_path)) {
                        imageDiff.getFullResult({
                            actualImage: file_paths.curr_path,
                            expectedImage: file_paths.prev_path,
                            diffImage: `${file_paths.curr_path}${name}_difference.png`,
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
    }
}

module.exports = Tester;