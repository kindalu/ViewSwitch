var User = require('../models/user');
var Page = require('../models/page');
var najax = require('najax');
var FacebookStrategy = require('passport-facebook').Strategy;
var fbConfig = {
  'clientID' : 'YOUR FACEBOOK APP ID',
  'clientSecret' : 'YOUR FACEBOOK APP SECRET',
  'callbackURL' : 'http://localhost:3000/login/facebook/callback',
  profileFields: ['id', 
                  'email', 
                  'first_name', 
                  'gender', 
                  'last_name', 
                  'likes.limit(200){id,category, name, about, link, picture.type(large)}'
                 ]
};

var savePageToDB = function (page){

  Page.findOne({ 'id' : page.id }, function(dbErr, pageFound) {

    if (dbErr){
      console.log('find page by id dbErr');
      return done(dbErr);
    }

    if (pageFound) return;

    var newPage = new Page();

    newPage.id = page.id;
    newPage.name = page.name;
    newPage.category = page.category;
    newPage.about  = page.about;
    newPage.link  = page.link;
    newPage.picture_url  = page.picture.data.url;

    newPage.save(function(dbErr) {
      if (dbErr) {
        console.log('add new page fail!!!');
        throw dbErr;
      }

    });

  });

}

var facebookStrategy = new FacebookStrategy(
    fbConfig,

    // facebook will send back the tokens and profile
    function(access_token, refresh_token, profile, done) {

      console.log('(' + profile.name.familyName + ' ' + profile.name.givenName + ') logined in');

      var UserPageIds = [];

      var processLikesResponse = function (res) {
          var likes_obj = JSON.parse(res);
          //found pages
          for(var key in likes_obj.data){

            UserPageIds.push(likes_obj.data[key].id);

            savePageToDB(likes_obj.data[key]);
          }

          //save likes to database
          if('paging' in likes_obj && 'next' in likes_obj.paging){
            najax(likes_obj.paging.next, processLikesResponse);
          }else{

            //save likes ids to User
            User.findOne({ 'id' : profile.id }, function(dbErr, user) {
              user.likes = UserPageIds;
              user.save(function(dbErr) {
                if (dbErr) {
                  console.log('create new user fail!!!');
                  throw dbErr;
                }

                console.log('(' + profile.name.familyName + ' ' + profile.name.givenName + ')\'s ' + UserPageIds.length + ' likes updated');
              });
            });
          }
      }


      // asynchronous
      process.nextTick(function() {

        // find the user in the database based on their facebook id
        User.findOne({ 'id' : profile.id }, function(dbErr, user) {


          if (dbErr)
            return done(dbErr);

          if (user) {
            return done(null, user);

          } else {
            
            var newUser = new User();

            newUser.id = profile.id;
            newUser.access_token = access_token;
            newUser.firstName  = profile.name.givenName;
            newUser.lastName = profile.name.familyName;
            newUser.email = profile.emails[0].value;

            // save new user profile to the database
            newUser.save(function(dbErr) {
              
              if (dbErr) {
                console.log('create new user fail!!!');
                throw dbErr;
              }

              console.log( '(' + profile.name.familyName + ' ' +profile.name.givenName + ')\'s profile saved');

              var profile_obj = JSON.parse(profile._raw);

              // save user likes
              for(var key in profile_obj.likes.data){
                UserPageIds.push(profile_obj.likes.data[key].id);
                savePageToDB( profile_obj.likes.data[key]);
              }

              // fetch next batch of user likes
              if('next' in profile_obj.likes.paging){
                najax(profile_obj.likes.paging.next, processLikesResponse);
              }

              return done(null, newUser);
            });
          }

        });

      });

    });

module.exports = function(passport){

  // Passport needs to be able to serialize and deserialize users to support persistent login sessions
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use( facebookStrategy);

}
