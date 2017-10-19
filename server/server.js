const _ = require('lodash');
const basicAuth = require('express-basic-auth');
const chalk = require('chalk');
const express = require('express');
const exphbs = require('express-handlebars');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const port = 3333;
const serveIndex = require('serve-index');
deb = function () {
	if (process.env.NODE_ENV.indexOf('development') === 0) {
		console.log.apply(console, arguments);

	} else if (process.env.NODE_ENV.indexOf('production') === 0) {

	}
};
global.deb = deb;
global.cleanRequire = function(file) {
    delete require.cache[require.resolve(file)];
    return require(file);
};

function authoriseUser(username, password, authorise) {
	/*
	 Generate new hash
	 const bcrypt = require('bcrypt');
	 const hash = bcrypt.hashSync('g63omKnbpiIl', bcrypt.genSaltSync(10));
	 console.log(hash);
	 */
	const Bcrypt = require('bcrypt');
	let users = _.map(require('./users'), (pass, i) => {
		return {
			username: i,
			password: pass
		};
	});
	let user = users[_.findIndex(users, {'username': username})];
	if (_.isEmpty(user)) {
		return authorise(null, false);
	}
	Bcrypt.compare(password, user.password, (err, is_valid) => {
		if (err) {
			console.log(err);
		}
		return authorise(null, is_valid);
	});
}

const app = express();
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(basicAuth({
	authorizer: authoriseUser,
	authorizeAsync: true,
	challenge: true,
}));

app.get('/', function (req, res) {
	fs.readdir('./projects', (err, files) => {
	    files = _.map(files, file => file.replace('.json', ''));
		let data = {
			projects: files
		};
		res.render('home', data);
	});
});

app.get('/:project/run-tests/', (req, res) => {
	const Test = require(path.resolve('./scripts/main'));
	new Test(req.params.project).run().then(result => {
		res.render('results', {project: req.params.project, result: result, test_result: result});
	}).catch(err => {
	    res.send(err);
    });
});

app.get('/:project/', (req, res) => {
	glob(`./screenshots/${req.params.project}/**/*.png`, (err, files) => {
	    // deb(err, files);
		if (err) return res(err);
		//console.log(files);
		files = _.reverse(_.sortBy(files, (file) => {
			return path.parse(file).dir.split('/')[3];
		}));
		const dates = _.groupBy(files, (file) => {
			return path.parse(file).dir.split('/')[3];
		});
		res.render('project', {project: req.params.project, dates: dates});
	});
});

app.use('/screenshots', express.static('screenshots'));

app.listen(port);

console.log(chalk.green(`Server listening on port ${port}`));

process.on('exit', (code) => {
	console.log(`About to exit with code: ${code}`);
});