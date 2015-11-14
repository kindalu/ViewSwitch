var User = require('../models/user');
var FacebookStrategy = require('passport-facebook').Strategy;
var fbConfig = {
  'clientID' : '934929516578701',
  'clientSecret' : 'ab1fdd34b94a4e1c71067479b8311c80',
  'callbackURL' : 'http://localhost:3000/login/facebook/callback',
  profileFields: ['id', 'birthday', 'email', 'first_name', 'gender', 'last_name', 'likes']
};

module.exports = function(passport){

  // Passport needs to be able to serialize and deserialize users to support persistent login sessions
  passport.serializeUser(function(user, done) {
    console.log('serializing user: ');console.log(user);
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      console.log('deserializing user:',user);
      done(err, user);
    });
  });

  passport.use(new FacebookStrategy(
    fbConfig,

    // facebook will send back the tokens and profile
    function(access_token, refresh_token, profile, done) {

      // asynchronous
      process.nextTick(function() {

        console.log('profile', profile);
        // find the user in the database based on their facebook id
        User.findOne({ 'id' : profile.id }, function(dbErr, user) {


          if (dbErr)
            return done(dbErr);
          
          if (user) {
            // user found, return that user
            console.log('found return user ' + profile.id);
            return done(null, user); 

          } else {
            // user not found create new user
            var newUser = new User();

            newUser.id = profile.id;              
            newUser.access_token = access_token;             
            newUser.firstName  = profile.name.givenName;
            newUser.lastName = profile.name.familyName;
            newUser.email = profile.emails[0].value;

            // save to the database
            newUser.save(function(dbErr) {
              if (dbErr) {
                console.log("create new user fail!!!");
                throw dbErr;
              }

              console.log("create new user " + profile.id + "sucess");
              return done(null, newUser);
            });
          }

        });

      });

    }));













}