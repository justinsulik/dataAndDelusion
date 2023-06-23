// https://pure-mountain-15758.herokuapp.com
// 23.06.23 upgrading heroku stack

// --- LOADING MODULES
const express = require('express');
const ejs = require("ejs");

// --- INSTANTIATE THE APP
const studyName = 'study1';
const app = express();
const PORT = process.env.PORT || 5000;

// --- MONGOOSE SETUP
// db.connect(process.env.MONGODB_URI);

// --- STATIC MIDDLEWARE
app.use(express.static(__dirname + '/public'));
app.use('/jspsych', express.static(__dirname + "/jspsych"));
app.use('/libraries', express.static(__dirname + "/libraries"));

// --- VIEW LOCATION, SET UP SERVING STATIC HTML
app.set('views', __dirname + '/public/views');
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

// --- ROUTING
app.get('/', (req, res) => {

  res.render('experiment.ejs');

});

app.get('/beads', (req, res) => {

  res.render('beadsdemo.ejs');

});

app.get('/finish', (req, res) => {

  res.send('<p>The demonstration is completed. You may close this window.');

});

// --- START THE SERVER

var server = app.listen(PORT, function(){
    console.log("Listening on port %d", server.address().port);
});
