const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: { // For a real app, use bcrypt. Keeping simple here.
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Admin', adminSchema);
