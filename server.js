const express = require('express');
const exphbs  = require('express-handlebars');
const fs = require('fs-extra');
const _ = require('lodash');
const glob = require('glob');
const app = express();
const basicAuth = require('express-basic-auth')
const serveIndex = require('serve-index');
const path = require('path');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

let data = [];


app.use(basicAuth({
    users: { 'admin': 'IloveTDSOFT' },
    challenge: true,
}))

app.get('/', function (req, res) {
	fs.readdir('screenshots', (err, files)=>{
		data = {
			projects: files
		};
    	res.render('home', data);
	});
});
let i = 0;
app.get('/rtfs', (req, res)=>{
	const screenshoter = require('child_process').exec('npm run new').stdout.on('data', (e)=>{
		if(i == 1){
			//console.log(e)
			//res.send(e);
			res.render('results', JSON.parse(e));
		}
		i++;
	});
});

app.get('/:project/', (req, res)=>{

	glob(`screenshots/${req.params.project}/**/*.png`, (err, files)=>{
		if(err) return (err);
		//console.log(files);
		files = _.reverse(_.sortBy(files, (file) => {
			return path.parse(file).dir.split('/')[2];
		}));
		const dates = _.groupBy(files, (file)=>{
			return path.parse(file).dir.split('/')[2];
		})
		//console.log(dates);
		res.render('project', {dates: dates})
	})
});

app.use('/screenshots', express.static('screenshots'))

app.listen(3333);