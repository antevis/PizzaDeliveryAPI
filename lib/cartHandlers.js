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
            // Extract the user's email from the token object
            const email = validator.validateByRegex(tokenData["email"], "email");

            if (email) {
              // Get the user object and investigate its cart situation
              _data.read("users", email, (err, userData) => {
                if (!err && userData) {
                  // Check for existing cart for a given user.
                  // Reject to create new if there is one and it is not empty.
                  // Cart may be created only if it doesn't exist OR it is empty.
                  const userHasCart = (typeof(userData["cart"]) == 'object');
                  const cartNotEmpty = userHasCart && helpers.objectHasKeys(userData["cart"]);

                  if (!userHasCart || !cartNotEmpty) {

                    // validate payload to conform to the menu
                    validator.validateCart(data.payload, (err, cartData) => {
                      if (!err && cartData) {

                        // Set user's cart to the cartData produced by validateCart()
                        userData.cart = cartData;

                        // Update the user (save cart to the user object)
                        _data.update('users', email, userData, err => {
                          if (!err) {
                            callback(200, cartData);
                          } else {
                            callback(500, {"Error":"Could not create the cart for the user."});
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
        // Verify token for expiration
        tokenHandlers.verifyExpiration(tokenId, isValidToken => {
          if (isValidToken) {
            // Extract the user's email from the token object
            const email = validator.validateByRegex(tokenData["email"], "email");

            if (email) {
              // Get the user's object
              _data.read("users", email, (err, userData) => {
                if (!err && userData) {
                  // Attempt to obtain the cart if one exists
                  const cart = typeof(userData["cart"]) == 'object' ? userData["cart"] : false;

                  if (cart) {
                    // Return the cart
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
// Editing the user's cart is semantically equivalent to replacing the old cart
// with the new one. That is, it's effectively more 'liberal' POST, which allows
// to replace the existing cart
// Required:
//  token (headers)
//  menu items (payload)
// Optional: none
lib.put = (data, callback) => {
  const tokenId = validator.validateStringByLength(data.headers.token, config.tokenLength);

  if (tokenId) {
    _data.read('tokens', tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        // Since users aren't required to provide an email,
        // token will be verified only against its expiration
        tokenHandlers.verifyExpiration(tokenId, isValidToken => {
          if (isValidToken) {
            // Extract the user's email from the token object
            const email = validator.validateByRegex(tokenData["email"], "email");

            if (email) {
              // Get the user object and investigate its cart situation
              _data.read("users", email, (err, userData) => {
                if (!err && userData) {
                  // validate payload to conform to the menu
                  validator.validateCart(data.payload, (err, cartData) => {
                    if (!err && cartData) {
                      // Set user's cart to the cartData produced by validateCart()
                      userData.cart = cartData;

                      // Update the user (save cart to the user object)
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


// DELETE
// Required:
//  token (headers)
// Optional: none
lib.delete = (data, callback) => {
  const tokenId = validator.validateStringByLength(data.headers.token, config.tokenLength);

  if (tokenId) {
    _data.read('tokens', tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        // Since users aren't required to provide an email,
        // token will be verified only against its expiration
        tokenHandlers.verifyExpiration(tokenId, isValidToken => {
          if (isValidToken) {
            // Extract the user's email from the token object
            const email = validator.validateByRegex(tokenData["email"], "email");

            if (email) {
              // Get the user object
              _data.read("users", email, (err, userData) => {
                if (!err && userData) {

                  delete userData["cart"];

                  // Update the user (save the user object without the cart)
                  _data.update('users', email, userData, err => {
                    if (!err) {
                      callback(200);
                    } else {
                      callback(500, {"Error":"Could not delete the user's cart."});
                    }
                  });
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

module.exports = lib;
