/*
 * Tokens handling methods
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

const lib = {};

// Verify the validity of a given token
lib.verifyToken = (id, email, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for a given user and hasn't expired
      const isValid = (tokenData.email == email && tokenData.expires > Date.now());
      callback(isValid);
    } else {
      callback(false);
    }
  });
};

// POST
// Required data: phone, email
// Optional data: none
lib.post = (data, calback) => {
  const email = helpers.validateByRegex('email', data.payload.email);
  const password = helpers.validateStringByMinLength(1, data.payload.password);

  if (email && password) {
    // Lookup the user with the matching email
    _data.read('users', email, (err, userData) => {
      if (!err && userData) {
        const passwdHash = helpers.hash(password);
        if(passwdHash == userData.passwdHash) {

          const id = helpers.createRandomString(20);
          const expires = Date.now() + config.tokenValidity;

          const token = {
            'email': email,
            'token': id,
            'expires': expires
          };

          // Save the token to disk
          _data.create('tokens', id, token, err => {
            if (!err) {
              callback(200, token);
            } else {
              callback(500, {'Error': 'Could not create the new token'});
            }
          });

        } else {
          callback(400, {'Error': 'Password mismatch'});
        }
      } else {
        callback(400, {"Error": "Could not find the specified user"});
      }
    });
  } else {
    callback(400, {"Error" : "Missing required field(s)"});
  }
};




module.exports = lib;
