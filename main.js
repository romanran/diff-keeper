const path = require('path');


function startTests() {
	return new Promise((resolve, reject) => {
		let Mocha = require('mocha');
		require('mocha-clean');
		let mocha = new Mocha({
			timeout: 60 * 60 * 1000,
			useColors: 1,
			reporter: 'JSON'
		});
		mocha.addFile(path.resolve('./runTests.js'));
		mocha.run().on('end', function () {
			resolve(this.testResults);
		});
	});
};
module.exports = startTests;