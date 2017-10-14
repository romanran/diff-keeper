const Tester = require('./scripts/Tester');
const glob = require('glob');
const _ = require('lodash');
const assert = require('assert');

// describe('Projects', function () {
// 	this.timeout(0);
// 	it('tests', function (done) {
		glob('./projects/*.json', function (err, files) {
			for (let file of files) {
				const project = require(file);
				const tester = new Tester(project);
				tester.run().then(function(){
					console.log(`Tests done for ${project.name}`);
					// done();
				}).catch(err => {
					console.log('ERROR', err);
					// done(err);
				});
			}
		});
//
// 	});
// });

it(`change window size to ${resolution.width} x ${resolution.height} px`, function (done) {
	// this.timeout(0);
	// deb('resize');
	driver.manage().window().setSize(resolution.width, resolution.height).then(function () {
		done();
	}).done(done);
});
it('open', function (done) {
	this.timeout(0);
	console.log('opening ', page.url);
	return driver.get(page.url).then(function (err, data) {
		setTimeout(function () {
			return done(false);
		}, 3000);
	});
});
_.forEach(page.elements, (element) => {
	it(`has element with ${element.by} ${element.selector} present`, function (done) {
		return driver.findElement(webdriver.By[element.by](element.selector)).then(function (webElement) {
			if (webElement) {
				return done();
			}
			return done(`not found`);
		}, function (err) {
			return done(err);
		});
	});
});
it('has less difference than 10%', function (done) {
	this.timeout(0);
	return _p.processScreenshots
		.call(_p, page.name, resolution, browser)
		.then(function (result) {
			//console.log(result);
			if (result.message) {
				console.log(result.message);
				done();
			}
			// try {
			assert.equal(result.percentage * 100 < 10, true, Math.floor(result.percentage * 100, 2) + '%');
			// } catch (e) {
			// 	return done(e);
			// }
			done();
		})
		.done(null, done)
		.catch(function (err) {
			done(new Error(err));
		});
});