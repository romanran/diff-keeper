const fs = require('fs-extra');
const _ = require('lodash');
const moment = require('moment');
const Tester = require('./tester');

class Screenshoter {
	constructor(projects) {
		this.imageDiff = require('image-diff');

		this.projects = projects;
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
			console.log('Tests done.');
		});
	}

}

module.exports = Screenshoter;