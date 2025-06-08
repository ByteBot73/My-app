const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  verificationCode: { type: String, default: null }
});

module.exports = mongoose.model('User', userSchema);
