var User = require('../models/user');
var FacebookStrategy = require('passport-facebook').Strategy;
var fbConfig = require('./fbConfig');

var addNewUserToDB = function addNewUserToDB(profile, access_token) {
  var newUser = new User();

  newUser.id = profile.id;
  newUser.access_token = access_token;
  newUser.firstName = profile.name.givenName;
  newUser.lastName = profile.name.familyName;
  newUser.gender = profile.gender;
  newUser.email = profile.emails[0].value;

  // save new user profile to the database
  newUser.save(function(dbErr) {
    if (dbErr) throw dbErr;
  });

  return newUser;
}

var facebookStrategy = new FacebookStrategy(
  fbConfig,

  // facebook will send back the tokens and profile
  function(access_token, refresh_token, profile, done) {

    console.log('(' + profile.name.familyName + ' ' + profile.name.givenName + ') logined in');

    var UserPageIds = [];

    // asynchronous
    process.nextTick(function() {

      // find the user in the database based on their facebook id
      User.findOne({
        'id': profile.id
      }, function(dbErr, user) {

        if (dbErr) throw dbErr;

        if (!user) {
          var newUser = addNewUserToDB(profile, access_token);
          return done(null, newUser);
        }
        return done(null, user);

      });

    });

  });

module.exports = function(passport) {

  // Passport needs to be able to serialize and deserialize users to support persistent login sessions
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(facebookStrategy);
}