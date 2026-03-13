const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegram_user_id: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String
  },
  first_name: {
    type: String
  },
  language_code: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
