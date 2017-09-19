const express = require('express');
const exphbs  = require('express-handlebars');
const fs = require('fs-extra');
const _ = require('lodash');
const app = express();
const serveIndex = require('serve-index');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

let data = [];



app.get('/', function (req, res) {
	fs.readdir('screenshots', (err, files)=>{
		data = {
			images: files
		};
    	res.render('home', data);
	});
});

//app.use('/screenshots/', serveIndex('./screenshots/'));
app.use('/screenshots', express.static('screenshots'))
let i = 0;
app.get('/runthatfuckingscreeenshoter', (req, res)=>{
	const screenshoter = require('child_process').exec('npm start').stdout.on('data', (e)=>{
		if(i == 1){
			//res.send(e);
			res.render('results', JSON.parse(e));
		}
		i++;
	});

});

app.listen(3333);