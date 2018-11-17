/*
 * Helpers for various tasks
 *
 */


// Dependencies
const url = require('url');
const path = require('path');

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

// Helpers module exporting
module.exports = helpers;
