'use strict';

require('dotenv').config();

const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db             = require('./db');

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8080}`;

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${BACKEND_URL}/api/auth/google/callback`,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email returned from Google.'));

      const name = profile.displayName || email.split('@')[0];

      const [[existing]] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing) return done(null, existing);

      const DEFAULT_ORG_ID = 1;
      const [result] = await db.query(
        'INSERT INTO users (name, email, password, role, organization_id) VALUES (?, ?, ?, ?, ?)',
        [name, email, '', 'member', DEFAULT_ORG_ID]
      );

      const [[newUser]] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      return done(null, newUser);
    } catch (err) {
      return done(err);
    }
  }
));

module.exports = passport;
