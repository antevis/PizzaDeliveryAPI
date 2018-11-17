/*
 * Handlers definintion
 *
 */

// Dependencies
const userMethods = require('./userHandlers');

// Define the handlers
const handlers = {};

// 'Users' handler
handlers.users = (data, callback) => {
  const acceptableMethdods = ['post', 'get', 'put', 'delete'];

  if(acceptableMethdods.indexOf(data.method) > -1) {
    userMethods[data.method](data, callback);
  } else {
    callback(405);
  }
};



handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
