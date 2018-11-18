/*
 * Handlers definintion
 *
 */

// Dependencies
const userMethodsModule = require('./userHandlers');
const tokenMethodsModule = require('./tokenHandlers');
const menuMethodsModule = require('./menuHandlers');

// Define the handlers
const handlers = {};

// Define methods for a given module
const defineMethods = methodsModule => {
  return (data, callback) => {
    const acceptableMethdods = ['post', 'get', 'put', 'delete'];

    if(acceptableMethdods.indexOf(data.method) > -1) {
      methodsModule[data.method](data, callback);
    } else {
      callback(405);
    }
  };
}

// Users handlers
handlers.users = defineMethods(userMethodsModule);

// Tokens handlers
handlers.tokens = defineMethods(tokenMethodsModule);

// Menu handlers
handlers.menu = defineMethods(menuMethodsModule);


handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
