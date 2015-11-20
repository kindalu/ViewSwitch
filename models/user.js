var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
  id: String,
  access_token: String,
  firstName: String,
  lastName: String,
  gender: String,
  email: String,
  likes: [String]
});