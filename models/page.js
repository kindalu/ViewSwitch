var mongoose = require('mongoose');

module.exports = mongoose.model('Pages', {
  id: String,
  name: String,
  category: String,
  created_time: String,
  about: String,
  description: String,
  link: String,
  picture_url: String
});