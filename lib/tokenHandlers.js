/*
 * Tokens handling methods
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const validator = require('./validators');

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

// Verify token expiration
lib.verifyExpiration = (id, callback) => {
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for a given user and hasn't expired
      const isValid = (tokenData.expires > Date.now());
      callback(isValid);
    } else {
      callback(false);
    }
  });
};

// User by tokenId
lib.userByTokenId = (tokenId, callback) => {
  tokenId = validator.validateStringByLength(tokenId, config.tokenLength);

  if (tokenId) {
    _data.read("tokens", tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        lib.verifyExpiration(tokenId, isValidToken => {
          if (isValidToken) {
            // Extract a user's email from the token object
            const email = validator.validateByRegex(tokenData["email"], "email");

            if (email) {
              _data.read("users", email, (err, userData) => {
                if (!err && userData) {
                  callback(false, userData);
                } else {
                  callback(500, {"Error" : "User not found."});
                }
              });
            } else {
              callback(500, {"Error" : "Error reading an email from the token data"});
            }
          } else {
            callback(403, {"Error" : "Specified token isn't valid."});
          }
        });
      } else {
        // console.log(err, tokenData);
        callback(404, {"Error" : "Token not found."});
      }
    });
  } else {
    callback(400, {"Error" : "Missing token in the headers."});
  }
};

// POST
// Required data: phone, email
// Optional data: none
lib.post = (data, callback) => {
  const email = validator.validateByRegex(data.payload.email, 'email');
  const password = validator.validateStringByMinLength(data.payload.password);

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
              const userTokens = helpers.arraify(userData.tokens);

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

// GET
// Required data: id
// Optional data: none
lib.get = (data, callback) => {
  // Check that the tokenId is valid
  const id = validator.validateStringByLength(data.queryStringObject.id, config.tokenLength);

  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(404, {"Error" : "Missing required field."});
  }
};

// DELETE
// Required data: tokenId in the queryString, email in the headers
// Optional data: none
lib.delete = (data, callback) => {
  // Check that the tokenId is valid
  const id = validator.validateStringByLength(data.queryStringObject.id, config.tokenLength);
  const email = validator.validateByRegex(data.headers.email, 'email');

  if (id && email) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {

        if (tokenData.email == email) {
          _data.delete('tokens', id, err => {
            if (!err) {
              // Delete also from the associated user
              _data.read('users', email, (err, userData) => {
                if (!err) {
                  // Remove token from the user object.
                  const userTokens = helpers.arraify(userData.tokens);

                  if (userTokens.length > 0) {
                    const tokenIdx = userTokens.indexOf(id);

                    if (tokenIdx > -1) {
                      userTokens.splice(tokenIdx, 1);
                      userData.tokens = userTokens;

                      _data.update('users', email, userData, err => {
                        if (!err) {
                          helpers.colorLog(`Removed token ${id} from user ${email}.`, "green","");
                        } else {
                          helpers.colorLog(`Failed to remove token ${id} from user ${email}.`, "red","bright");
                        }
                      });

                    } else {
                      helpers.colorLog(`The user ${email} contains no token ${id}.`, "yellow", "");
                    }
                  } else {
                    // User contains no token data
                    helpers.colorLog(`The user ${email} contains no tokens.`, "yellow", "");
                  }
                } else {
                  // Means the token has already been orphaned earlier (no user associated with it)
                  helpers.colorLog(`Deleted orphaned token ${id} associated with the user ${email}, which hasn't been found.`, "yellow", "");
                }
              });

              // Reporting 200 regardless of the user existence
              callback(200);

            } else {
              callback(500, {"Error" : "Couldn't find the specified token"});
            }
          });

        } else {
          helpers.colorLog(`Possible fraud: An attempt to delete the token ${id} associated with ${tokenData.email} providing ${email} in headers.`, "red","bright");
          callback(400); // Bad request, possible fraudulent activity: someone probably tries to delete someone else's token.
        }
      } else {
        callback(404);
      }
    });
  } else {
    callback(404, {"Error" : "Missing required field."});
  }
};

// PUT - Don't see any practical reason for updating the exiting token data.





module.exports = lib;
