// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

// Define the user schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please enter a valid email address'
    }
  },
  password: { type: String, required: true },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  refreshToken: {
    type: String,
    default:null
  },
  termsAndConditions: {
    type: Boolean,
    default:null
  },
  marketingConsent: {
    type: Boolean,
    default:null
  },
  createDate: {
    type: String,
    default:null
  }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('username')) {
    const currentDate = new Date();
    const isoDate = currentDate.toISOString();
    this.createDate = isoDate;
  }
  next();
});

// Compare password method
UserSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.setPassword = async function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
