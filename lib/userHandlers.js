/*
 * Users handling methods
 *
 */

//Dependencies
const helpers = require('./helpers');
const _data = require('./data');

const lib = {};

lib.post = (data, callback) => {
  // Check the required fields
  const name = (typeof(data.payload.name) == 'string' &&
    data.payload.name.trim().length > 0) ? data.payload.name : false;

  const streetAddress = (typeof(data.payload.streetAddress) == 'string' &&
    data.payload.streetAddress.trim().length > 0) ?
    data.payload.streetAddress : false;

  const email = helpers.validateByRegex('email', data.payload.email);

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
              callback(500, {'Error': "Couldn't create the new user."});
            }
          });
        } else {
          callback(500, {"Error": "Couldn't hash the user's password."});
        }
      } else {
        // Ther is a file with the name matching that of a proposed user's email
        callback(400, {"Error": "User with that email already exists."});
      }
    });
  } else {
    callback(400, {"Error": "Missing required fields."});
  }
};




module.exports = lib;
