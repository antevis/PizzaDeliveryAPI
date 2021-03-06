/*
 * Users handling methods
 *
 */

//Dependencies
const helpers = require('./helpers');
const _data = require('./data');
const tokenHandlers = require('./tokenHandlers');
const validator = require('./validators');
const config = require('./config');

const lib = {};

// POST
// Required data: name, streetAddress, email, password
// Optional data: none
lib.post = (data, callback) => {
  // Check the required fields
  const name = (typeof(data.payload.name) == 'string' &&
    data.payload.name.trim().length > 0) ? data.payload.name : false;

  const streetAddress = (typeof(data.payload.streetAddress) == 'string' &&
    data.payload.streetAddress.trim().length > 0) ?
    data.payload.streetAddress : false;

  const email = validator.validateByRegex(data.payload.email, 'email');

  const password = (typeof(data.payload.password) == 'string' &&
    data.payload.password.trim().length > 0) ? data.payload.password : false;

  if (name && streetAddress && email && password) {

    _data.read('users', email, (err, data) => {

      if (err) {
        // Safely add new user since there isn't one with that email exist
        const passwdHash = helpers.hash(password);

        if(passwdHash) {

          const userObject = {name, email, streetAddress, passwdHash};

          _data.create('users', email, userObject, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {'Error' : "Couldn't create the new user."});
            }
          });
        } else {
          callback(500, {"Error" : "Couldn't hash the user's password."});
        }
      } else {
        // Ther is a file with the name matching that of a proposed user's email
        callback(400, {"Error" : "User with that email already exists."});
      }
    });
  } else {
    callback(400, {"Error" : "Missing required fields."});
  }
};

// GET
// Required data:
//  email in query string
//  valid token in the headers
// Optional data: none
lib.get = (data, callback) => {
  // Check that the phone number is valid
  const email = validator.validateByRegex(data.queryStringObject.email, 'email');

  if (email) {
    // Get the token from the headers
    const token = validator.validateString(data.headers.token);

    tokenHandlers.verifyToken(token, email, isValidToken => {
      if (isValidToken) {
        _data.read('users', email, (err, userData) => {
          if (!err && userData) {
            // Remove the hased password before returning it to the requester.
            delete userData.passwdHash;
            callback(200, userData);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {"Error" : "Missing required token in the header OR it isn't valid."});
      }
    });
  } else {
    callback(400, {'Error' : 'Unable to parse the email'});
  }
};

// PUT
// Requied data: email
// Optional data: name, streetAddress, password (at least one must be provided)
lib.put = (data, callback) => {
  const email = validator.validateByRegex(data.payload.email, 'email');
  const name = validator.validateStringByMinLength(data.payload.name);
  const streetAddress = validator.validateStringByMinLength(data.payload.streetAddress);
  const password = validator.validateStringByMinLength(data.payload.password);

  if (email) {
    if (name || streetAddress || password) {
      const token = validator.validateString(data.headers.token);

      tokenHandlers.verifyToken(token, email, isValidToken => {
        if (isValidToken) {

          // Lookup the user
          _data.read('users', email, (err, userData) => {
            if (!err && userData) {
              if (name) userData.name = name;
              if (streetAddress) userData.streetAddress = streetAddress;
              if (password) userData.passwdHash = helpers.hash(password);

              // Save userData to disk
              _data.update('users', email, userData, err => {
                if (!err) {
                  callback(200);
                } else {
                  helpers.colorLog(err, "red", "bright");
                  callback(500, {"Error" : "Could not update the user"});
                }
              });

            } else {
              calback(400, {"Error" : "Specified user doesn't exist."})
            }
          });
        } else {
          callback(403, {"Error" : "Missing token in the request's header or it isn't valid."});
        }
      });
    } else {
      callback(400, {"Error" : "Missing fields to update"});
    }
  } else {
    callback(400, {"Error" : "Missing required field"});
  }

};

// DELETE
// Required data: email in query, tokenId in headers
// Optional data: none
lib.delete = (data, callback) => {
  const email = validator.validateByRegex(data.queryStringObject.email, 'email');

  if (email) {
    const token = validator.validateString(data.headers.token);

    tokenHandlers.verifyToken(token, email, isValidToken => {
      if (isValidToken) {
        _data.read('users', email, (err, userData) => {
          if (!err && userData) {
            // Delete the user
            _data.delete('users', email, err => {
              if (!err) {

                // Delete all associated tokens
                const userTokens = helpers.arraify(userData.tokens);
                if (userTokens.length > 0) {
                  let deletionErrors = false;

                  userTokens.forEach(tokenId => {
                    _data.delete('tokens', tokenId, err => {
                      if (err) {
                        helpers.colorLog(`Failed to delete token ${tokenId}. It will remain orphaned.`, "red", "bright");
                        deletionErrors = true;
                      }
                    });
                  });
                  if (deletionErrors) {
                    helpers.colorLog("Errors encountered while attempting to delete user's tokens. Probably not all associated tokens have been deleted.", "red");
                  }
                }

                // Make all user-associated orders orphaned by setting 'email' field to arbitrary (yet common for this user's orders) string
                // Might be helpful for data analytics in the future
                const userOrderIDs = helpers.arraify(userData.orders);

                // console.log(userOrders);
                const orphanId = helpers.createRandomString(config.tokenLength);
                const userOrders = [];

                userOrderIDs.forEach(id => {
                  // Reading synchronously to retain data within the scope.
                  userOrders.push(_data.readSync('orders', id));
                });

                userOrders.forEach(order => {
                  order.email = orphanId;
                  _data.update('orders', order.id, order, err => {
                    if (err) {
                      helpers.colorLog(`Error removing email of deleted user from the order: ${order.id}`, "red");
                    }
                  });
                });

                // Respond OK on successful user deletion reagrdless of the internal server housekeeping troubles with related tokens and orders.
                callback(200);

              } else {
                callback(500, {"Error" : "Could not delete the specified user."});
              }
            });
          } else {
            callback(400, {"Error" : "Could not delete the specified user."});
          }
        });
      } else {
        callback(403, {"Error" : "Missing token in the request's header or it isn't valid."});
      }
    });
  } else {
    callback(400, {"Error" : "Missing required field."});
  }
};


module.exports = lib;
