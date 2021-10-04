const express = require('express');
const mysql = require('mysql');
require('dotenv').config();
const ejs = require('ejs');
const passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');
const CryptoJS = require('crypto-js');

const app = express();
app.set('view engine', 'ejs');

app.use('/', express.static(__dirname + '/public'));

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

var logged = false;
var con;
//const config = require('./config.json');
const config = {"host" : process.env.host,"user" : process.env.user,"password" : process.env.password,"database" : process.env.database}

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {
      console.log("ok " + username + " " + user.password);
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != CryptoJS.MD5(password)) { return cb(null, false); }
      return cb(null, user);
    });
  }));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/home', function (req, res) {

  res.render('home', {logged: logged});
/*
  con = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  con.connect();

  con.query("SELECT * FROM cdd_trainings", function (err, results, fields) {
    if (err) throw err;
    if (results.length != 0) {
      res.render('home', { logged: logged, trainings: results });
    } else {
      res.send("There is no training");
    }
  });
*/

});

app.get('/login',
  function(req, res){
    res.render('login');
  });

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout',
  function(req, res){
    req.logout();
    res.redirect('/');
  });

app.get('/profile',
  //require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { logged: logged});
  });

app.get('/tasks',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    var tasks = [{"id":1, "name":"Acheter le pain"}, {"id":2, "name":"Prendre un café"}];
    res.render('tasks', { tasks: tasks });
  });

app.get('/signup', function (req, res) {

  res.render('signup');

})

app.post('/signup', function (req, res) {

  console.log(req.body.username);
  console.log(req.body.password);

  var username = req.body.username;

  // We do an MD5 hash of the password because passwords are stored this way
  var password = CryptoJS.MD5(req.body.password);

  con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });

  con.connect();

  var sql = "INSERT INTO cdd_users (id, username, password, email) VALUES ('"+Date.now()+"','"+req.body.username+"','"+CryptoJS.MD5(req.body.password)+"','"+req.body.email+"')";

  con.query(sql, function (err, result, fields) {
    if (err) throw err;
    res.send("Please wait for a phone call or Email");
  });

})

app.get('/signout', function (req, res) {

  con.end();
  logged = false;
  res.render('signup');

})

app.get('/signin', function (req, res) {

  con = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
  });

  res.render('signin');

})

app.post('/signin', function (req, res) {

  console.log(req.body.username);
  console.log(req.body.password);

  var username = req.body.username;

  // We do an MD5 hash of the password because passwords are stored this way
  var password = CryptoJS.MD5(req.body.password);

  con = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  con.connect();

  con.query("SELECT * FROM cdd_users WHERE username = '" + username + "'", function (err, result, fields) {
    if (err) throw err;
    if (result.length != 0) {
      if (result[0].password == password) {
        //res.send(result);
        logged = true;
        if (result[0].id == '1') {
          res.redirect('admin');
        } else {
          res.redirect('dashboard');
        }
      } else {
        res.send("Wrong Password");
      }
    } else {
      res.send("User Not Found");
    }
  });

})
// END TEST

app.get('/dashboard', function (req, res) {

  res.render('dashboard', { logged: logged});

})

app.get('/report', function (req, res) {

  res.render('report', { logged: logged});

})

app.get('/admin', function (req, res) {

  res.render('admin');

})

app.post('/admin/login', function (req,res) {

  con = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    res.send("Hello " + username + "! The database state is " + con.state + " ...");
  });

});

app.get('/admin/profiles/insert', function (req, res) {

  var sql = "INSERT INTO cdd_profile (id, first_name, last_name, address, zip_code, city) VALUES ('1234', 'Jaques', 'Chabrol', '42, Rue Jean Jaurès', '35700', 'Rennes')";
  con.query(sql, function (err, result) {
    if (err) throw err;
    //console.log("1 record inserted");
    res.send("1 record inserted");
  });

})

app.get('/admin/profiles/list', function (req, res) {

  con.query("SELECT * FROM cdd_profile", function (err, result, fields) {
    if (err) throw err;
    //console.log(result);
    res.send(result);
  });

})

app.get('/admin/profiles/delete', function (req, res) {

  var sql = "DELETE FROM cdd_users WHERE first_name = 'Jaques'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    //console.log("Number of records deleted: " + result.affectedRows);
    res.send("Number of records deleted: " + result.affectedRows);
  });

})


app.get('/admin/users/delete', function (req, res) {

  var sql = "DELETE FROM cdd_users WHERE username = 'unicorn2'";
  con.query(sql, function (err, result) {
    if (err) throw err;
    //console.log("Number of records deleted: " + result.affectedRows);
    res.send("Number of records deleted: " + result.affectedRows);
  });

})

var port = process.env.PORT || 3001;

app.listen(port, function () {

  console.log('Chaudoudoux app listening on port 3001!')

})