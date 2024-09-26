// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');

// Load User model
const User = require('../models/User');

// Secret keys for JWT
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || "a random secret 7546";

module.exports = function(passport) {
    //local strategy
    passport.use(
        new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
            // Match user
            try {
                const user = await User.findOne({ username: username });
                if (!user) {
                    return done(null, false, { message: 'That username is not registered' });
                }

                // Match password
                const isMatch = await user.matchPassword(password);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });

    // JWT Strategy
    const opts = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessTokenSecret,
    };

  passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await User.findOne({ username: jwt_payload.username });
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (err) {
      return done(err)
    }
    })
  );

};

