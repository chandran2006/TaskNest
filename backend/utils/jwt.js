'use strict';

const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    {
      user_id:         user.id,
      name:            user.name,
      email:           user.email,
      role:            user.role,
      organization_id: user.organization_id ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { generateToken };
