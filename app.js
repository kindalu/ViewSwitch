var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var dbConfig = {
  'url': 'mongodb://localhost:27017/fb-hack-test'
};
var mongoose = require('mongoose');
mongoose.connect(dbConfig.url);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

var expressSession = require('express-session');

app.use(expressSession({
  secret: 'mySecretKey',
  resave: true,
  saveUninitialized: true
}));

var flash = require('connect-flash');
app.use(flash());

var passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

var initPassport = require('./passport/init');
initPassport(passport);

var routes = require('./routes/index')(passport);

app.use('/', routes);

app.listen(3000, function (err) {
  if(err){
    console.log(err);
  }else{
    console.log('now listen to http://localhost:3000/');
  }
});