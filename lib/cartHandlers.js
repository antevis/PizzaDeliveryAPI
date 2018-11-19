/*
 * Cart handling methods
 *
 */

//Dependencies
const config = require('./config');
const _data = require('./data');
const helpers = require('./helpers');
const tokenHandlers = require('./tokenHandlers');
const validator = require('./validators');

const lib = {};

// POST
// Required:
//  token (headers)
//  menu items (payload)
// Optional: none
lib.post = (data, callback) => {
  const tokenId = validator.validateStringByLength(data.headers.token, config.tokenLength);

  if (tokenId) {
    _data.read('tokens', tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        // Since users aren't required to provide an email,
        // token will be verified only against its expiration
        tokenHandlers.verifyExpiration(tokenId, isValidToken => {
          if (isValidToken) {
            // Check for existing cart for a given user.
            // Reject to create new if there is one and it is not empty.
            const email = validator.validateByRegex(tokenData["email"], "email");

            if (email) {
              // Get the user object and investigate its cart situation
              _data.read("users", email, (err, userData) => {
                if (!err && userData) {
                  // Cart may be created only if it doesn't exist OR it is empty.
                  const userHasCart = (typeof(userData["cart"]) == 'object');
                  const cartNotEmpty = userHasCart && helpers.objectHasKeys(userData["cart"]);

                  if (!userHasCart || !cartNotEmpty) {

                    // validate payload to conform to the menu
                    validator.validateCart(data.payload, (err, cartData) => {
                      if (!err && cartData) {
                        userData.cart = cartData;

                        _data.update('users', email, userData, err => {
                          if (!err) {
                            callback(200, cartData);
                          } else {
                            callback(500, {"Error":"Could not update the user's cart."});
                          }
                        });

                      } else {
                        callback(400, {"Error" : "Couldn't parse the cart."});
                      }
                    });

                  } else {
                    callback(405, {"Error" : "There is a cart with items in it. Delete first."});
                  }
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
        callback(404);
      }
    });
  } else {
    callback(400, {"Error" : "Missing token in the headers."});
  }

};

// GET
// Required:
//  token (headers)
// Optional: none
lib.get = (data, callback) => {
  const tokenId = validator.validateStringByLength(data.headers.token, config.tokenLength);

  if (tokenId) {
    _data.read("tokens", tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        tokenHandlers.verifyExpiration(tokenId, isValidToken => {
          if (isValidToken) {
            const email = validator.validateByRegex(tokenData["email"], "email");

            if (email) {
              _data.read("users", email, (err, userData) => {
                if (!err && userData) {
                  const cart = typeof(userData["cart"]) == 'object' ? userData["cart"] : false;

                  if (cart) {
                    callback(200, cart);
                  } else {
                    callback(404);
                  }
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
        callback(404);
      }
    });
  } else {
    callback(400, {"Error" : "Missing token in the headers."});
  }
};

// PUT
// Required:
//  token (headers)
//  menu items (payload)
// Optional: none
lib.put = (data, callback) => {};

// DELETE
// Required:
//  token (headers)
// Optional: none
lib.delete = (data, callback) => {};

module.exports = lib;
