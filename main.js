const path = require('path');
const fs = require('fs-extra');
const moment = require('moment');

function startTests(project) {
	return new Promise((resolve, reject) => {
		let Mocha = require('mocha');
		require('mocha-clean');
		let mocha = new Mocha({
			timeout: 60 * 60 * 1000,
			useColors: 1,
			reporter: 'JSON'
		});
		global.project = project;
		fs.pathExists(`./projects/${project}.json`).then(exists => {
		    if (!exists) {
		        return reject(`./projects/${project} doesn't exist`);
            }
            mocha.addFile(path.resolve('./scripts/runTests.js'));
            mocha.run().on('end', function () {
                const [dir, time] = [path.resolve(`./reports/${project}/`), moment().format('YYYY-MM-D_HH-mm')];
                fs.ensureDir(dir).then(() => fs.writeJson(`${dir}/${time}.json`, this.testResults));
                resolve(this.testResults);
            });
        });
	});
};
module.exports = startTests;