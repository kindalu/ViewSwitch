var express = require('express');
var router = express.Router();
var getLikesByUser = require('../passport/getLikesByUser');

var isAuthenticated = function isAuthenticated(req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler 
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/');
}

module.exports = function(passport) {

  /* GET login page. */
  router.get('/', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('index.html', {
      message: req.flash('message')
    });
  });

  // route for facebook authentication and login
  // different scopes while logging in
  router.get('/login/facebook',
    passport.authenticate('facebook', {
      scope: ['email', 'user_likes']
    })
  );

  // handle the callback after facebook has authenticated the user
  router.get('/login/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/home',
      failureRedirect: '/'
    })
  );

  /* GET Home Page */
  router.get('/home', isAuthenticated, function(req, res, next) {

    //fetch the user likes and posts
    getLikesByUser(req.user, function(userLikes) {
      res.locals.data =  {
        userLikes: userLikes
      };
      next();
    });

  });

  router.get('/home', isAuthenticated, function(req, res) {
    res.render('home.html', {
      user: req.user,
      likes: res.locals.data.userLikes
    });
  });

  /* Handle Logout */
  router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  /* Handle Not Found */
  router.get('*', function(req, res) {
    res.redirect('/');
  });

  return router;
}