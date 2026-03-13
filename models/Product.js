const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  game: {
    type: String,
    required: true
  },
  package: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
