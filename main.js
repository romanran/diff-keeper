const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');
let Mocha = require('mocha');
const _ = require('lodash');

let mocha = new Mocha({
    timeout: 60 * 60 * 1000,
    useColors: 1,
    reporter: 'JSON'
});

require('mocha-clean');
function resetTests(suite) {
    suite.tests.forEach(function (t) {
        delete t.state;
        t.timedOut = false;
    });
    suite.suites.forEach(resetTests);
}

function startTests(project) {
    return new Promise((resolve, reject) => {
        global.project = project;
        fs.pathExists(`./projects/${project}.json`).then(exists => {
            if (!exists) {
                return reject(`./projects/${project} doesn't exist`);
            }
            resetTests(mocha.suite);

            mocha.addFile(path.resolve('./scripts/runTests.js'));
            mocha.run().on('end', function() {
                const [dir, time] = [path.resolve(`./reports/${project}/`), moment().format('YYYY-MM-D_HH-mm')];
                fs.ensureDir(dir).then(() => fs.writeJson(`${dir}/${time}.json`, this.testResults));
                resolve(this.testResults);
            });
        });
    });
}

module.exports = startTests;