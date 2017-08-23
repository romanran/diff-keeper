const fs = require('fs');
const _ = require('lodash');
const assert = require('assert');
const webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
const imageDiff = require('image-diff');
const width = 1920;
//const height = 1080;

const driver = new webdriver.Builder()
    .forBrowser('phantomjs')
    .build();

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
            curr: `screenshots/${name}_current.png`,
            prev: `screenshots/${name}_previous.png`
        };
        setTimeout(() => {
            driver.saveScreenshot(file.curr).then(function() {
                if (fs.existsSync(file.prev)) {
                    imageDiff.getFullResult({
                        actualImage: file.curr,
                        expectedImage: file.prev,
                        diffImage: `screenshots/${name}_difference.png`,
                        shadow: true
                    }, function(err, result) {
                        fs.unlinkSync(file.prev);
                        fs.renameSync(file.curr, file.prev);
                        if (err) return reject(err);
                        return resolve(result);
                    });
                } else {
                    fs.renameSync(file.curr, file.prev);
                    return resolve({
                        message: 'No previous file'
                    });
                }
            });
        }, 5000);
    });
}
/*
 */

let pages = [{
    name: 'Homepage',
    url: 'https://networkrail.co.uk/',
    elements: [{
        by: 'className',
        selector: 'cookie_notification'
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
            it('should open homepage', function(done) {
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
                    }).then(function(height) {
                        //console.log(height);
                        height = 1080;
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
                        return done(e);
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