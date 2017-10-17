const ImageDiff = require('./scripts/ImageDiff');
const glob = require('glob');
const _ = require('lodash');
const assert = require('assert');
const forEach = require('mocha-each');

describe('Screenshots', function () {
	it('prepare', function (done) {
		// this.timeout(0);
		glob('./projects/*.json', function (err, files) {
			for (let file of files) {
				const project_json = require(file);
				const Project = new ImageDiff(project_json);
				Project.run().then(function () {
					console.log(`Screenshots done for ${project_json.name}`);
					done();
					runTests(Project);
				}).catch(err => {
					console.log('ERROR', err);
					done(err);
				});
			}
		});
	});
});

function runTests(Project) {
	describe(`Project ${Project.project.name}`, function () {
		it('project has necessary info', function () {
			return assert.ok(Project.valid);
		});
	});
	_.forEach(Project.tests, function (test) {
		deb(test);
		describe(`${test.page.name} screenshot`, function () {
			//
			forEach(test.dom_elements)
				.it(`has element `, function (element) {
					return assert.ok(_.isObject(element.found));
				});

			it('has less than 10% difference from previous one', function () {
				if (_.hasIn(test, 'diff.percentage')) {
					return assert.equal(test.diff.percentage * 100 < 10, true, Math.floor(test.diff.percentage * 100, 2) + '%');
				} else {
					return assert.ok(_.hasIn(test, 'diff.percentage'));
				}
			});

		});
	});
}