

// --- LOADING MODULES
const express = require('express'),
    url = require('url'),
    body_parser = require('body-parser'),
    detect = require('browser-detect'),
    geoip = require('geoip-lite'),
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
app.use('/libraries', express.static(__dirname + "/libraries"));

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
    const trialId = makeCode(2)+'5'+makeCode(5)+'nMn'+makeCode(4)+'z'+makeCode(2);
    const browser = detect(req.headers['user-agent']);
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    let geo = {};
    if(ip){
      geo = geoip.lookup(ip);
    }
    tasks.save({
        "workerId": workerId,
        "hitId": hitId,
        "assignmentId": assignmentId,
        "sessionId": sessId,
        "studyName": studyName,
        "trialId": trialId,
        "ip": ip,
        "geo": geo,
        "browser": browser
    });

    let proceed = 'proceed';

    // check browser compatibility
    if (browser) {
      if (browser.mobile==true || browser.name=="IE") {
        proceed = 'browserIssue';
      }
    }

    // check from US
    if (geo) {
      if (geo.country != 'US' && geo.country != 'GB'){
        proceed = 'wrongCountry';
      }
    }

    switch (proceed) {
      case 'browserIssue':
        res.send('You seem to be viewing this either on a mobile device or with Internet Explorer. ' +
        'The instructions explicitly forbade those. Please just return the HIT. ' +
        'Do not just try reload this HIT with another browser. (Error: mt0)');
        break;

      case 'wrongCountry':
        res.send('It seems you have already completed a similar task for us before so you will not be able to complete this one. ' +
        'Please just return the HIT. Sorry for the inconvenience. (Error: mt3)');
        break;

      case 'proceed':
        console.log('Rendering survey...');
        res.render('experiment.ejs', {trialId: JSON.stringify(trialId)});
        break;
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


app.get('/TyNFQbzAlF', (req, res) => {
  let code = req.query.gvmejG;
  if(code){
    if(code.length>=0){
      code = code +'5'+makeCode(3) + 's';
    } else {
      code = makeCode(10) + 'E3E';
    }

  } else {
    code = makeCode(10) + 'E3E';
  }

  res.render('finish.ejs', {completionCode: code});
});

// --- SAVE TRIAL DATA

app.post('/Vn3OGu8kcy', (req, res) => {

  const data = req.body;
  const sessionId = req.session.id;
  const trialId = req.query.trialId || 'none';
  console.log(trialId, 'Preparing to save trial data...');

  responses.save({
      sessionId: sessionId,
      trialData: data,
      trialId: trialId,
      studyName: studyName,
  });
  
  res.status(200).end();
});


// --- START THE SERVER

var server = app.listen(PORT, function(){
    console.log("Listening on port %d", server.address().port);
});
