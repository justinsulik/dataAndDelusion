// save data after each block
// check screen size
// update farewell screen address
//


// --- LOADING MODULES
const express = require('express'),
    url = require('url');
    body_parser = require('body-parser'),
    Vue = require('vue'),
    renderer = require('vue-server-renderer').createRenderer(),
    session = require('express-session'),
    db = require('./model/db'),
    tasks = require('./controllers/tasks'),
    responses = require('./controllers/responses'),
    {makeCode} = require('./helper/codeString.js');

// --- INSTANTIATE THE APP
const studyName = 'study1';
const app = express();
const PORT = process.env.PORT || 5000;
app.use(
  session({
    secret: 'slave screw major outer',
    resave: false,
    saveUninitialized: true,
  })
);

// --- MONGOOSE SETUP
db.connect(process.env.MONGODB_URI);

// --- STATIC MIDDLEWARE
app.use(express.static(__dirname + '/public'));
app.use('/jspsych', express.static(__dirname + "/jspsych"));
app.use('/p5', express.static(__dirname + "/p5"));

// --- BODY PARSING MIDDLEWARE
app.use(body_parser.json()); // to support JSON-encoded bodies

// --- VIEW LOCATION, SET UP SERVING STATIC HTML
app.set('views', __dirname + '/public/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// --- ROUTING
app.get('/', (req, res) => {
    const sessId = req.session.id;
    const workerId = req.query.workerId || '';
    const assignmentId = req.query.assignmentId || '';
    const hitId = req.query.hitId || '';
    const completionCode = makeCode(2)+'3'+makeCode(5)+'iTi'+makeCode(4)+'w'+makeCode(2);
    const taskId = makeCode(2)+'5'+makeCode(5)+'nMn'+makeCode(4)+'z'+makeCode(2);
    tasks.save({
        "workerId": workerId,
        "hitId": hitId,
        "assignmentId": assignmentId,
        "completionCode": completionCode,
        "sessionId": sessId,
        "studyName": studyName,
        "taskId": taskId
    });
    res.render('consent.html', {taskId: taskId});
});

app.get('/experiment', (req, res) => {
    var taskId = req.query.test;
    if( taskId.length > 0 ){
        res.render('experiment.html', {taskId: taskId});
    } else {
        res.render('experiment.html');
    }

});

app.get('/x4d89', (req, res) => {
  const sessId = req.session.id;
  const query = {'sessionId': sessId};
  tasks.get(query, function(completionCode){
    const farewell = new Vue({
      data: {
         code: completionCode
      },
      template: `<div>
      <p>
        Your completion code is: {{ code }}. Copy+paste this into the MTurk window to get paid.
      </p>
      <p>
      If you have questions or comments, please mail <a href='mailto:justin.sulik@gmail.com' target = '_top'>justin.sulik@gmail.com.</a>
      </p>
      </div>`
    });

    renderer.renderToString(farewell, (err, html) => {
      if (err) {
        res.status(500).end('Internal Server Error.')
        return
      }
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
          <head><title>Hello</title></head>
          <body>${html}</body>
        </html>
      `);
    });

  });

});

// --- SAVE TRIAL DATA

app.post('/experiment-data', function(req, res){
  const trialId = req.query.trialId || 'none';
  console.log(trialId)
  const sessId = req.session.id;
  const data = req.body;
  console.log('Preparing to save trial data...', sessId);
  responses.save({
      "sessionId": sessId,
      "trialData": data,
      "trialId": trialId,
      "studyName": studyName,
  });
  res.send(200);
  res.end();
  console.log('Data saved...')
});


// --- START THE SERVER

var server = app.listen(PORT, function(){
    console.log("Listening on port %d", server.address().port);
});
