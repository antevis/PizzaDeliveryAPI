/*
 * Handlers definintion
 *
 */

// Dependencies
const userMethodsModule = require('./userHandlers');
const tokenMethodsModule = require('./tokenHandlers');
const menuMethodsModule = require('./menuHandlers');
const paymentMethodsModule = require('./paymentHandlers');
const cartMethodsModule = require('./cartHandlers');

// Define the handlers
const handlers = {};

// Define methods for a given module
const defineMethods = (methodsModule, acceptableMethdods) => {
  return (data, callback) => {

    if(acceptableMethdods.indexOf(data.method) > -1) {
      methodsModule[data.method](data, callback);
    } else {
      callback(405);
    }
  };
}

// Users handlers
handlers.users = defineMethods(userMethodsModule, ['post', 'get', 'put', 'delete']);

// Tokens handlers
handlers.tokens = defineMethods(tokenMethodsModule, ['post', 'get', 'delete']);

// Menu handlers
handlers.menu = defineMethods(menuMethodsModule, ['get']);

// Payment Handlers
handlers.pay = defineMethods(paymentMethodsModule, ['post']);

// Cart handlers
handlers.cart = defineMethods(cartMethodsModule, ['post', 'get', 'put', 'delete']);


handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
