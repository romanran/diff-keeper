const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const Tester = require('./tester');

class Screenshoter {
    constructor() {
        this.imageDiff = require('image-diff');

        this.projects = [{
            name: 'networkrail',
            browsers: ['chrome'],
            resolutions: [{
                width: 1920,
                height: 1080
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
        const tester = new Tester(this.projects[0]);
        tester.run().then(() => {
            console.log('wykuirwilo wszystko!!!');
        });
    }

}

module.exports = Screenshoter;