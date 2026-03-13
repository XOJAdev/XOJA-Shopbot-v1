const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    required: true,
    unique: true
  },
  telegram_user_id: {
    type: Number,
    required: true
  },
  username: {
    type: String
  },
  game: {
    type: String,
    required: true
  },
  player_id: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  screenshot_file_id: {
    type: String, // Telegram file_id of the payment screenshot
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'rejected'],
    default: 'pending'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
