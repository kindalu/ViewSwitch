var User = require('../models/user');
var Page = require('../models/page');
var najax = require('najax');
var FacebookStrategy = require('passport-facebook').Strategy;
var fbConfig = {
  'clientID' : 'Your Facebook App ID',
  'clientSecret' : 'Your Facebook App Secret',
  'callbackURL' : 'http://localhost:3000/login/facebook/callback',
  profileFields: ['id', 'email', 'first_name', 'gender', 'last_name', 'likes.limit(100){id, category, name, about, link, picture.type(large)}']
};

var savePageToDB = function (page){
  //console.log('this is page:', page);

  Page.findOne({ 'id' : page.id }, function(dbErr, pageFound) {

    if (dbErr){
      console.log('find page by id dbErr');
      return done(dbErr);
    }

    if (pageFound) {
      // user found, return that user
      console.log('found page ' + page.name);
      //return done(null, pageFound);
      return;
    } else {
      // user not found create new user
      var newPage = new Page();

      newPage.id = page.id;
      newPage.name = page.name;
      newPage.category  = page.category;
      newPage.about  = page.about;
      newPage.link  = page.link;
      newPage.picture_url  = page.picture.data.url;

      // save to the database
      newPage.save(function(dbErr) {
        if (dbErr) {
          console.log("add new page fail!!!");
          throw dbErr;
        }

        console.log("added " + page.name + " sucess");
        //return done(null, newPage);
      });
    }

  });

}

module.exports = function(passport){

  // Passport needs to be able to serialize and deserialize users to support persistent login sessions
  passport.serializeUser(function(user, done) {
    //console.log('serializing user: ');console.log(user);
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      //console.log('deserializing user:',user);
      done(err, user);
    });
  });


  passport.use(new FacebookStrategy(
    fbConfig,

    // facebook will send back the tokens and profile
    function(access_token, refresh_token, profile, done) {

      //var profile_obj = JSON.parse(profile._raw);

      //console.log(profile_obj.likes.data[0].picture);

      var UserPageIds = [];

      var loadPageCallback = function (res) {
          var likes_obj = JSON.parse(res);
          //found pages
          for(var key in likes_obj.data){

            UserPageIds.push(likes_obj.data[key].id);

            savePageToDB(likes_obj.data[key]);
          }

          //save likes to database
          if('paging' in likes_obj && 'next' in likes_obj.paging){
            najax(likes_obj.paging.next, loadPageCallback);
          }else{

            //save likes ids to User
            User.findOne({ 'id' : profile.id }, function(dbErr, user) {
              user.likes = UserPageIds;
              user.save(function(dbErr) {
                if (dbErr) {
                  console.log("create new user fail!!!");
                  throw dbErr;
                }

                console.log("update user " + user.id + " likes ~ success");
              });
            });

            console.log('load all the pages for user. :)');
          }
      }


      // asynchronous
      process.nextTick(function() {

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

              var profile_obj = JSON.parse(profile._raw);

              console.log(profile_obj.likes);

              for(var key in profile_obj.likes.data){
                UserPageIds.push(profile_obj.likes.data[key].id);
                savePageToDB( profile_obj.likes.data[key]);
              }

              //fetch next pages
              if('next' in profile_obj.likes.paging){
                najax(profile_obj.likes.paging.next, loadPageCallback);
              }

              console.log("create new user " + profile.id + "sucess");
              return done(null, newUser);
            });
          }

        });

      });

    }));

}
