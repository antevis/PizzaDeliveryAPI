/*
 * Helpers for various tasks
 *
 */


// Dependencies
const url = require('url');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

// Helpers mudule declaration
const helpers = {};

helpers.reqData = req => {

  const data = {};

  // Get te URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  data.trimmedPath = path.replace(/^\/+|\/+$/g,'');

  // Get the query string as an object
  data.queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  data.method = req.method.toLowerCase();

  // Get the headers as an object
  data.headers = req.headers;

  return data;
};

// Parse a JSON string to an object in all cases without throwing
helpers.jsonify = str => {
  try {
    return JSON.parse(str);
  } catch(e) {
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = str => {
  if (typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  }

  return false;

};

// Create a string of random alphanumeric characters of a given length
helpers.createRandomString = len => {
  len = typeof(len) == 'number' && len > 0 ? len : false;

  if (len) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    let str = '';

    for(let i = 0; i < len; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return str;
  }
  return false;
};


helpers.validateByRegex = (pattern, candidate) => {
  const re = {
    'email' : /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  };

  if (re[pattern] instanceof RegExp) {
    if(re[pattern].test(candidate)) {
      return candidate;
    }
  }
  return false;
}

helpers.validateStringByMinLength = (minLength, candidate) => {
  return (typeof(candidate) == 'string' &&
    candidate.trim().length >= minLength) ?
      candidate : false;
}



// Helpers module exporting
module.exports = helpers;
