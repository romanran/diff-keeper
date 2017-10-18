const ImageDiff = require('./ImageDiff');
const glob = require('glob');
const path = require('path');
const _ = require('lodash');
const assert = require('assert');
const forEach = require('mocha-each');
let i = 0;
describe('Screenshots', function () {
	it('prepare', function (done) {
		// this.timeout(0);
        const file = global.project;
        const project_json = cleanRequire(path.resolve(`./projects/${file}`));
        const Project = new ImageDiff(project_json);
        Project.run().then(function () {
            done();
            runTests(Project);
        }).catch(err => {
            console.log('ERROR', err);
            done(err);
        });
    });
});

function runTests(Project) {
    i++;
    deb('RAN', i);
	describe(`Project ${Project.project.name}`, function () {
		it('project has necessary info', function () {
			return assert.ok(Project.valid);
		});
	});
	_.forEach(Project.tests, function (test) {
		// deb(test);
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