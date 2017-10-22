const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const path = require('path');

class Test {
    constructor(page, resolution, browser) {
        this.page = page;
        this.resolution = resolution;
        this.browser = browser;
        this.added = [];
    }

    set(name, type) {
        if (!_.hasIn(this, name)) {
            _.set(this, name, type);
        }
    }

    add(name, item) {
        if (!_.hasIn(this, name)) {
            _.set(this, name, item);
        }
        if (_.isArray(this[name])) {
            this[name].push(item);
        } else if (_.isObject(this[name])) {
            _.set(this[name], item);
        }
        this.added.push(name);
    }

    get getJson() {
        let obj = {
            page: this.page,
            resolution: this.resolution,
            browser: this.browser
        };
        _.forEach(this.added, added => {
           obj[added] = this[added];
        });
        return obj;
    }
}
module.exports = Test;