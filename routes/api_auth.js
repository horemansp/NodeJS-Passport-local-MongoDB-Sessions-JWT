const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const passport = require('passport');
const api_router = express.Router();

// Secret keys for JWT
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "a random secret 7546";
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "a random secret 754*/8";
const tokenExpiration = process.env.ACCESS_TOKEN_EXPIRATION || '5m';
const refreshTokenExpiration = process.env.REFRESH_TOKEN_EXPIRATION || '7d';

// Token generation
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
  };

  const accessToken = jwt.sign(payload, accessTokenSecret, { expiresIn: tokenExpiration }); // Short-lived access token
  const refreshToken = jwt.sign(payload, refreshTokenSecret, { expiresIn: refreshTokenExpiration }); // Long-lived refresh token

  return { accessToken, refreshToken };
};


// Login
api_router.post('/login', async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;

  try {
    var user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log("returned user:",user);
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;

    await user.save();

    user = await User.findOne({ username });
    console.log("user after save:",user)

    res.json(tokens);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Refresh token
api_router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, refreshTokenSecret);
    const user = await User.findById(decoded.id);
    console.log("user",user)

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    console.log("user:",user,"refreshtoken:", user.refreshToken,"  2"),
    await user.save();

    res.status(200).json(tokens);
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: 'Token expired or invalid' });
  }
});

// Logout (invalidate refresh token)
api_router.post('/logout', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.refreshToken = null;
    await user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Protected route example
api_router.get('/protected', passport.authenticate('jwt', { session: false }), async (req, res) => {
  res.status(200).json({
    message: 'You are successfully accessing a protected route!'
  });
});

module.exports = api_router;

