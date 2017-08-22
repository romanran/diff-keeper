const fs = require('fs');
var assert = require('assert');
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;
var imageDiff = require('image-diff');
const width = 1920;
//const height = 1080;

var driver = new webdriver.Builder()
    .forBrowser('chrome')
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
        let file = {
            curr: `screenshots/${name}_current.png`,
            prev: `screenshots/${name}_previous.png`
        };
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
    });
}
/*
[{
page: 'homepage'
url: 'url'
elements: [
    'selektor1',
    'selektor2',
    'selektor3'
    ],
}]
 */

describe('Homepage', () => {
    it('Should open homepage', function(done) {
        this.timeout(0);
        driver.get('https://networkrail.co.uk/').then((err, data) => {
            setTimeout(() => {
                done(err);
            }, 3000);
        });
    });
    it('Should resize window', (done) => {
        driver.findElement(By.xpath('//html')).then((el) => {
            driver.executeScript(function() {
                return document.getElementsByTagName('body')[0].scrollHeight;
            }).then(function(height) {
                console.log(height);
                driver.manage().window().setSize(width, height).then(done);
            });
        });
    });
    it('Should have less difference than 10%', function(done) {
        this.timeout(0);
        processScrenshoots(driver, 'homepage').then((result) => {
            console.log(result);
            if (result.message) {
                console.log(result.message);
                return done(null);
            }
            try {
                assert.equal(result.percentage * 100 < 10, true, Math.floor(result.percentage * 100, 2) + '%');
            } catch (e) {
                return done(e);
            }
            done();
        }).catch(done);
    });
    it('Should close the browser', (done) => {
        driver.quit().then((err) => {
            done(err);
        });
    });
});