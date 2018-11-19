/*
 * Validators of various sorts. They have been initially in helpers
 * until circular reference took place.
 *
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

const lib = {};

lib.validateCart = (candidateCart, callback) => {
  _data.read('.', 'menu', (err, menuData) => {
    if (!err && menuData) {

      let cart = {};
      for (let key in candidateCart) {
        // Values in menuData are prices, so exisence may be evaluated against 'number'.
        // Values in candidateCart should be integers to represent descreet quantities of pizzas
        if (typeof(menuData[key]) == 'number' && Number.isInteger(candidateCart[key])) {
          cart[key] = candidateCart[key];
        }
      }

      if (helpers.objectHasKeys(cart)) {
        callback(false, cart);
      } else {
        callback(true);
      }

    } else {
      callback(true);
    }
  });
};

lib.validateByRegex = (candidate, pattern) => {
  const re = {
    'email' : /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  };

  if (re[pattern] instanceof RegExp) {
    if(re[pattern].test(candidate)) {
      return candidate;
    }
  }
  return false;
};

lib.validateString = candidate => {
  return typeof(candidate) == 'string' ? candidate : false;
};

lib.validateStringByMinLength = (candidate, minLen=1) => {
  return (lib.validateString(candidate) &&
    candidate.trim().length >= minLen) ?
      candidate : false;
};

lib.validateStringByLength = (candidate, len) => {
  return (lib.validateString(candidate) &&
    candidate.trim().length == len) ?
      candidate : false;
};

module.exports = lib;
