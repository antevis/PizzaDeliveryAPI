/*
 * Menu handling methods (only GET in fact)
 *
 */

// Dependencies
const helpers = require('./helpers');
const _data = require('./data');
const config = require('./config');
const tokenHandlers = require('./tokenHandlers');
const validator = require('./validators');

const lib = {};

// GET
// Required data: tokenId in the headers
// Optional data: none
lib.get = (data, callback) => {
  // Get the token id from the headers.
  // At this step it's only checked to be a string of length 20.
  const id = validator.validateStringByLength(data.headers.token, config.tokenLength);

  if (id) {
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Since users aren't required to provide an email for getting the menu,
        // token will be verified only against its expiration
        tokenHandlers.verifyExpiration(id, isValidToken => {
          if (isValidToken) {
            // Read menu from .data/menu.json file
            _data.read('.', 'menu', (err, menuData) => {
              if (!err && menuData) {
                callback(200, menuData);
              } else {
                callback(500, {"Error" : "Error retrieving the menu."});
              }
            });
          } else {
            callback(403, {"Error" : "Specified token isn't valid."});
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {"Error" : "Missing required field."});
  }
};


module.exports = lib;
