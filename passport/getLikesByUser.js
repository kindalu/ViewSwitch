var Page = require('../models/page');
var graph = require('fbgraph');

var savePageToDB = function(page) {

  Page.findOne({
    'id': page.id
  }, function(dbErr, pageFound) {

    if (dbErr) {
      console.log('find page by id dbErr');
      return done(dbErr);
    }

    if (pageFound) {
      if (pageFound.id != page.id ||
        pageFound.name != page.name ||
        pageFound.category != page.category ||
        pageFound.about != page.about ||
        pageFound.link != page.link ||
        pageFound.picture_url != page.picture_url) {

        pageFound.id = page.id;
        pageFound.name = page.name;
        pageFound.category = page.category;
        pageFound.about = page.about;
        pageFound.link = page.link;
        pageFound.picture_url = page.picture_url;

        pageFound.save(function(dbErr) {
          if (dbErr) {
            console.log('update old page fail!!!');
            throw dbErr;
          }

        });
      }

      return;
    }

    var newPage = new Page();

    newPage.id = page.id;
    newPage.name = page.name;
    newPage.category = page.category;
    newPage.about = page.about;
    newPage.link = page.link;
    newPage.picture_url = page.picture.data.url;

    newPage.save(function(dbErr) {
      if (dbErr) {
        console.log('add new page fail!!!');
        throw dbErr;
      }

    });

  });

}

module.exports = function getLikesByUser(user) {

  var processLikesResponse = function(err, res) {
    var likes;
    if ('likes' in res)
      likes = res.likes; //first call
    else
      likes = res; //later call by next in paging

    for (var key in likes.data) {

      UserPageIds.push(likes.data[key].id);
      savePageToDB(likes.data[key]);
    }

    if (likes.paging && likes.paging.next) {
      graph.get(likes.paging.next, processLikesResponse);
    } else {

      user.likes = UserPageIds;
      user.save(function(dbErr) {
        if (dbErr) {
          console.log('update new user likes fail!!!');
          throw dbErr;
        }

        console.log('(' + user.firstName + ' ' + user.lastName + ')\'s ' + UserPageIds.length + ' likes updated');
      });
    }
  }

  var UserPageIds = [];

  graph.setAccessToken(user.access_token);
  var options = {
    timeout: 3000,
    pool: {
      maxSockets: Infinity
    },
    headers: {
      connection: "keep-alive"
    }
  };

  //'likes.limit(200){id,category, name, about, link, picture.type(large)}'
  graph
    .setOptions(options)
    .get("me?fields=likes.limit(100){name,about,picture}", processLikesResponse);

}