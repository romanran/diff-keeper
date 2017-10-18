const ImageDiff = require('./ImageDiff');
const glob = require('glob');
const async = require('async');
const path = require('path');
const _ = require('lodash');
const Test = require('tap');
const fs = require('fs-extra');
const moment = require('moment');

const test = Test.test;
require('tap-json')();

/*
 const [dir, time] = [path.resolve(`./reports/${project}/`), moment().format('YYYY-MM-D_HH-mm')];
 fs.ensureDir(dir).then(() => fs.writeJson(`${dir}/${time}.json`, this.testResults));
 resolve(this.testResults);
 */

module.exports = class {
    constructor(project) {
        this.project = project;
    }

    run() {
        const project = this.project;

        const tasks = [
            done => {
                fs.pathExists(`./projects/${project}.json`).then(exists => {
                    let err = exists ? null : `./projects/${project} doesn't exist`;
                    done(err, '');
                });
            },
            (nothing, done) => {
                const project_json = cleanRequire(path.resolve(`./projects/${project}`));
                const Project = new ImageDiff(project_json);
                Project
                    .run()
                    .then(result => done(null, Project))
                    .catch(err => {
                        console.log('ERROR', err);
                        done(err);
                    });
            }, (Project, err, done) => {
                this.runTests(Project).then(data => done(null, data));
            }
        ];

        return new Promise((resolve, reject) => {
            async.waterfall(tasks, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }

    runTests(Project) {
        return new Promise((resolve, reject) => {
            test.onFinish(deb);
            test(`Project ${Project.project.name}`, assert => {
                assert.ok(Project.valid, 'project has necessary info');
            });
            _.forEach(Project.tests, test_task => {
                test(`${test_task.page.name} screenshot`, assert_sc => {
                    _.forEach(test_task.dom_elements, element => {
                        assert_sc.ok(_.isObject(element.found), `has element ${element.selector}`);
                    });

                    assert_sc.test('has less than 10% difference from previous one', assert_comp => {
                        if (_.hasIn(test_task, 'diff.percentage')) {
                            assert_comp.equal(test_task.diff.percentage * 100 < 10, true, Math.floor(test_task.diff.percentage * 100, 2) + '% < 10%');
                        } else {
                            assert_comp.ok(_.hasIn(test_task, 'diff.percentage'), 'Object has difference');
                        }
                        assert_comp.end();
                    });
                    assert_sc.end();
                });
            });
            Test.tearDown(e => {
                const results = e;
                const [dir, time] = [path.resolve(`./reports/${this.project}/`), moment().format('YYYY-MM-D_HH-mm')];
                fs.ensureDir(dir).then(() => fs.writeJson(`${dir}/${time}.json`, results));
                deb(e);
                resolve(results);
                test.end();
            });
        });
    }
};