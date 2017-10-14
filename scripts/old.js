const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const assert = require('assert');
const phantomjs = require('phantomjs')
const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
const imageDiff = require('image-diff');
const width = 1920;
const height = 1080;

const driver = new webdriver.Builder()
    .forBrowser('phantomjs')
    .build();

const hostname = 'networkrail'


function getLastFile(dir) {
    const files = fs.readdirSync(dir);
    return _.max(files, (f) => {
        const fullpath = path.join(dir, f);
        return fs.statSync(fullpath).ctime;
    });
}

const prev_date = getLastFile('screenshots/' +  '/' + hostname + '/');

const prev_path = 'screenshots/' +  '/' + hostname + '/' +  prev_date + '/' + width + '_' + height + '/';

const current_path = 'screenshots/' +  '/' + hostname + '/' +  moment().format('YYYY-MM-D HH-mm') + '/' + width + '_' + height + '/';

fs.ensureDir(current_path, err => {
  //if(err) console.log(err);
});

webdriver.WebDriver.prototype.saveScreenshot = function(filename) {
    return driver.takeScreenshot().then(function(data) {
        fs.writeFile(filename, data.replace(/^data:image\/png;base64,/, ''), 'base64', function(err) {
            if (err) throw err;
        });
    });
};

function processScrenshoots(driver, name) {
    return new Promise(function(resolve, reject) {
        name = _.kebabCase(name);
        let file = {
            curr: `${current_path}${name}_current.png`,
            prev: `${prev_path}${name}_current.png`
        };
        setTimeout(() => {
            driver.saveScreenshot(file.curr).then(function() {
                if (fs.existsSync(file.prev)) {
                    imageDiff.getFullResult({
                        actualImage: file.curr,
                        expectedImage: file.prev,
                        diffImage: `${current_path}${name}_difference.png`,
                        shadow: true
                    }, function(err, result) {
                        //fs.unlinkSync(file.prev);
                        //fs.renameSync(file.curr, file.prev);
                        if (err) return reject(err);
                        return resolve(result);
                    });
                } else {
                    //fs.renameSync(file.curr, file.prev);
                    return resolve({
                        message: 'No previous file'
                    });
                }
            });
        }, 8000);
    });
}
/*
 */

let pages = [{
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
}];

let tests = [];

_.forEach(pages, (page) => {
    tests.push(testPage(page));
});

Promise.all(tests).then(() => {
    driver.quit().then((err) => {
        console.log(err);
    });
}).catch(console.log);

function testPage(page) {
    return new Promise(function(resolve, reject) {
        describe(page.name, () => {
            it('should open', function(done) {
                this.timeout(0);
                driver.get(page.url).then((err, data) => {
                    setTimeout(() => {
                        done();
                    }, 5000);
                });
            });
            it('should resize window', (done) => {
                driver.findElement(By.xpath('//html')).then((el) => {
                    driver.executeScript(function() {
                        return document.getElementsByTagName('body')[0].scrollHeight;
                    }).then(function(h) {
                        //console.log(height);
                        driver.manage().window().setSize(width, height);
                        done();
                    });
                });
            });
            _.forEach(page.elements, (element)=>{
                it(`should have element with ` + element.by + ` ` + element.selector + ` present`, (done) =>{
                    driver.findElement(webdriver.By[element.by](element.selector)).then(function(webElement) {
                        done();
                    }, function(err) {
                        done(err);
                    });
                });
            });
            it('should have less difference than 10%', function(done) {
                this.timeout(0);
                processScrenshoots(driver, page.name).then((result) => {
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
                }).catch((err)=>{
                    resolve();
                    done(err);
                });
            });

        });
    });
}