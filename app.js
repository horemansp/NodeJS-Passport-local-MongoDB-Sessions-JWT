/*
TODO cleanup expired sessions
*/

// app.js
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('./models/User');
const MongoStore = require('connect-mongo');
require('dotenv').config();


const app = express();
//public directory & view engine
var publicDir = require('path').join(__dirname,'/public'); 
app.use(express.static(publicDir)); 
app.set('view engine', 'ejs');

// Middleware to parse incoming request bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); 

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Express session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// Passport.js initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }
      const isValid = await user.isValidPassword(password);
      if (!isValid) {
        return done(null, false, { message: 'Incorrect password' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);
const api_authRoutes = require('./routes/api_auth');
app.use('/api_auth', api_authRoutes);

// Basic routes
app.get('/', (req, res) => {
  if(req.isAuthenticated()){
    res.render('index');
  } else {
    const message = req.query.message;
    res.render('loginpages/login',{message});
  }
});

app.get('/reset-password', (req, res) => {
        res.render('loginpages/reset-password');
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
