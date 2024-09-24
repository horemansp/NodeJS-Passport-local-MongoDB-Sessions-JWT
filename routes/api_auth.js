const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const api_router = express.Router();

// Secret keys for JWT
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const tokenExpiration = process.env.ACCESS_TOKEN_EXPIRATION;
const refreshTokenExpiration = process.env.REFRESH_TOKEN_EXPIRATION;

// Token generation
const generateAccessToken = (user) => {
  return jwt.sign({ username: user.username }, accessTokenSecret, { expiresIn: tokenExpiration });
};
const generateRefreshToken = (user) => {
  return jwt.sign({ username: user.username }, refreshTokenSecret, { expiresIn: refreshTokenExpiration });
};
// Login route
api_router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send('{"message":"User not found"}');
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).send('{"message":"Invalid credentials"}');
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  // Save refresh token in the database
  user.refreshToken = refreshToken;
  await user.save();
  res.json({
    accessToken,
    refreshToken
  });
});

// Middleware to authenticate access tokens
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('{"message":"Access Token Required"}');
  jwt.verify(token, accessTokenSecret, (err, user) => {
    if (err) return res.status(403).send('{"message":"Invalid or Expired Token"}');
    req.user = user;
    next();
  });
};

// Protected API route
api_router.get('/protected', authenticateToken, (req, res) => {
  res.send(`Hello, ${req.user.username}, this is a protected route.`);
});

// Refresh token route
api_router.post('/token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).send('{"message":"Refresh Token Required"}');
  // Check if the refresh token is valid and stored in the database
  const user = await User.findOne({ refreshToken });
  if (!user) return res.status(403).send('{"message":"Invalid Refresh Token"}');
  jwt.verify(refreshToken, refreshTokenSecret, (err, userPayload) => {
    if (err) return res.status(403).send('{"message":"Invalid or Expired Refresh Token"}');
    const accessToken = generateAccessToken({ username: userPayload.username });
    res.json({ accessToken });
  });
});

module.exports = api_router;