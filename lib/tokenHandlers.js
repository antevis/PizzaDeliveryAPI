/*
 * Tokens handling methods
 *
 */

// Dependencies

const lib = {};

// Verify the validity of a given token
lib.verifyToken = (token, email, callback) => {
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
    
  }
};




module.exports = lib;
