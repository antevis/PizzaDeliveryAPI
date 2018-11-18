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
lib.post = (data, callback) => {
  const email = helpers.validateByRegex(data.payload.email, 'email');
  const password = helpers.validateStringByMinLength(data.payload.password);

  if (email && password) {
    // Lookup the user with the matching email
    _data.read('users', email, (err, userData) => {
      if (!err && userData) {
        const passwdHash = helpers.hash(password);
        if(passwdHash == userData.passwdHash) {

          const id = helpers.createRandomString(config.tokenLength);
          const expires = Date.now() + config.tokenValidity;

          const token = {
            'email': email,
            'token': id,
            'expires': expires
          };

          // Save the token to disk
          _data.create('tokens', id, token, err => {
            if (!err) {

              // Add token to the user object. Will help in case of deleting the
              // user to also delete the associated tokens.
              const userTokens =
                typeof(userData.tokens) == 'object' &&
                userData.tokens instanceof Array ? userData.tokens : [];

              userData.tokens = userTokens;
              userData.tokens.push(id);

              _data.update('users', email, userData, err => {
                if (!err) {
                  callback(200, token);
                } else {
                  // Landing here means that token has been created but failed to be added
                  // to the user. Should be deleted to avoid future inconsistencies
                  _data.delete('tokens', id, err => {
                    if (!err) {
                      callback(500, {"Error" : "Could not update the user with the new token. No tokens have been added."});
                    } else {
                      callback(500, {"Error" : "Could not delete token that failed to be added to the associated user."});
                    }
                  });
                }
              });
            } else {
              callback(500, {'Error' : 'Could not create the new token'});
            }
          });
        } else {
          callback(400, {'Error' : 'Password mismatch'});
        }
      } else {
        callback(400, {"Error" : "Could not find the specified user"});
      }
    });
  } else {
    callback(400, {"Error" : "Missing required field(s)"});
  }
};




module.exports = lib;
