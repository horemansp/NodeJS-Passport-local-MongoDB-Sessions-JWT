// routes/auth.js
const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const sendEmail = require('../utils/sendEmail');
const router = express.Router();

// Password validation regex
const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'some random secret 9544-';
const VALIDATION_TIMEOUT = process.env.VALIDATION_TIMEOUT || '5m';
const BASE_PATH = process.env.BASE_PATH || 'http://localhost:3000';
const APP_NAME = process.env.APP_NAME || 'NodeJS login app';
// Register Route
router.post('/register', async (req, res) => {
  const { username, password, termsAndConditions, marketingConsent } = req.body;

  if(!termsAndConditions){
    return res.status(403).send('{"message":"You must agree with the terms and conditions"}');
  }

  if (!validator.isEmail(username)) {
    return res.status(400).send('{"message":"Invalid email format"}');
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).send('{"message":"Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character."}');
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('{"message":"something went wrong"}');
    }

    const user = new User({
      username,
      password,
      isVerified: false,
      termsAndConditions,
      marketingConsent
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '5m' });
    const verificationLink = BASE_PATH + `/auth/verify-email?token=${token}`;
    await sendEmail(username, 'Verify your email', `<p>Please click the link to verify your email: <a href="${verificationLink}">Verify Email</a></p>`);

    res.status(200).send('{"message":"Registration successful. Please check your email to verify your account. (You may need to check your SPAM folder)"}');
  } catch (err) {
    res.status(500).send('{"message":"something went wrong"}');
  }
});

// Verify Email Route
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).send('Invalid verification token');
    }

    if (user.isVerified) {
      return res.send('Your email is already verified.');
    }

    user.isVerified = true;
    await user.save();
    res.redirect('/?message=validation%20successful,%20please%20login');
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.redirect('/resend-validation');
    }
    res.status(400).send('Invalid token or verification error');
  }
});

// Resend verification email route
router.post('/resend-verification', async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('{"message":"Something went wrong."}');
    }

    if (user.isVerified) {
      return res.status(400).send('{"message":"This account is already verified."}');
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '5m' });
    const verificationLink = BASE_PATH + `/auth/verify-email?token=${token}`;
    await sendEmail(username, 'Resend Email Verification', `<p>Please click the link to verify your email: <a href="${verificationLink}">Verify Email</a></p><p>If you did not requested a new verification link, then ignore this email.</p>`);

    res.status(200).send('{"message":"A new verification email has been sent. Follow the instructions. You can close this page. (Check you SPAM folder)"}');
  } catch (err) {
    res.status(500).send('{"message":"Error resending verification email"}');
  }
});

// Login Route
router.post('/login', async (req, res, next) => {

  const { username, password } = req.body;

  if (!validator.isEmail(username)) {
    return res.status(400).send('{"message":"Invalid email format"}');
  }

  try {
    const user = await User.findOne({ username });

    if (!user.username) {
      return res.status(400).send('{"message":"Something went wrong"}');
    }
    if (!user.isVerified) {
      return res.status(401).send('{"message":"Please verify your email before logging in. You have received an email with instructions during registration process. Request a new link if you cannot find you validation link. (check your SPAM folder)"}');
    }

    // Use passport authentication if email is verified
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err); // Pass the error to the error handler
      }

      if (!user) {
        // If no user is found or the credentials are incorrect, send custom error message
        return res.status(400).send('{"message":"Invalid email & password combination"}');
      }

      // Log the user in if credentials are valid
      req.logIn(user, (err) => {
        if (err) {
          return next(err); // Handle login errors
        }
        // Login successful, send a success response
        return res.send({"message":"Login successful"});
      });
    })(req, res, next);
  } catch (err) {
    res.status(500).send('{"message":"Something went wrong"}');
  }
});


// Logout Route
router.post('/logout', (req, res) => {
  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    // Clear the connect.sid cookie
    res.clearCookie('connect.sid');
    res.status(200).send('{"message":"Logged out!"}');
  });
});



router.post('/forgot-password', async (req, res) => {
  const { username } = req.body; // Expecting the email address

  if (!validator.isEmail(username)) {
    return res.status(400).send('{"message":"Invalid email format"}');
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('{"message":"If you provided a registered email you wil receive an email with instructions."}');
    }

    // Generate a JWT token for password reset (expires in 15 minutes)
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: VALIDATION_TIMEOUT });

    // Send the password reset email
    const resetLink = BASE_PATH + `/reset-password?token=${token}`;
    await sendEmail(username, 'Reset Your Password', `<p>Please click the link to reset your password: <a href="${resetLink}">Reset Password</a></p><p>If you have not initiated a forgot-password then ignore this email.</p>`);

    res.status(200).send('{"message":"If you provided a registered email you wil receive an email with instructions. You can close this page. (Check your SPAM folder)"}');
  } catch (err) {

    res.status(500).send('{"message":"Something went wrong"}');
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!newPassword || !passwordRegex.test(newPassword)) {
    return res.status(400).send('{"message":"Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character."}');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).send('{"message":"Invalid or expired token."}');
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();
    await sendEmail(username, APP_NAME +' Password was reset', `<p>Your password for the "${APP_NAME} was reseet.</p><p>If this was you, then ignore this email. If this was not you, then change your password as soon as possible</p>`);
    res.send('{"message":"Password succesfully changed. Please logout and login again with your new password."}');
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).send('{"message":"Password reset token has expired. Please request a new one."}');
    }
    res.status(400).send('{"message":"Invalid token or password reset error"}');
  }
});

// Change Password Route
router.post('/change-password', passport.authenticate('session'), async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);
    const oldPasswordVerification = await user.isValidPassword(oldPassword);
    
    if (!oldPasswordVerification) {
      return res.status(401).json({ message: 'Old password is incorrect.' });
    } 

    user.password = newPassword
    await user.save();

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {

    res.status(500).json({ message: 'An error occurred while changing the password.' });
  }
});

module.exports = router;
