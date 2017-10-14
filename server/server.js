const express = require('express');
const exphbs = require('express-handlebars');
const fs = require('fs-extra');
const _ = require('lodash');
const glob = require('glob');
const basicAuth = require('express-basic-auth')
const serveIndex = require('serve-index');
const path = require('path');

const app = express();
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

/*
Generate new hash
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('g63omKnbpiIl', bcrypt.genSaltSync(10));
console.log(hash);
 */

function authoriseUser(username, password, authorise) {
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
	console.log(password, user.password);
	Bcrypt.compare(password, user.password, (err, is_valid) => {
		console.log('valid', is_valid);
		if (err) {
			console.log(err);
		}
		return authorise(null, is_valid);
	});
}

app.use(basicAuth({
	authorizer: authoriseUser,
	authorizeAsync: true,
	challenge: true,
}));

app.get('/', function (req, res) {
	fs.readdir('../screenshots', (err, files) => {
		let data = {
			projects: files
		};
		res.render('home', data);
	});
});
let i = 0;
app.get('/rtfs', (req, res) => {
	const screenshoter = require('child_process').exec('npm start').stdout.on('data', (e) => {
		if (i === 1) {
			//console.log(e)
			//res.send(e);
			res.render('results', JSON.parse(e));
		}
		i++;
	});
});

app.get('/:project/', (req, res) => {

	glob(`../screenshots/${req.params.project}/**/*.png`, (err, files) => {
		if (err) return (err);
		//console.log(files);
		files = _.reverse(_.sortBy(files, (file) => {
			return path.parse(file).dir.split('/')[2];
		}));
		const dates = _.groupBy(files, (file) => {
			return path.parse(file).dir.split('/')[2];
		});
		//console.log(dates);
		res.render('project', {dates: dates})
	})
});

app.use('/screenshots', express.static('screenshots'));

app.listen(3333);