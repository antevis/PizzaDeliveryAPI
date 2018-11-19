/*
 * Helpers for various tasks
 *
 */


// Dependencies
const url = require('url');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const querystring = require('querystring');
const https = require('https');

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


helpers.validateByRegex = (candidate, pattern) => {
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

helpers.validateString = (candidate) => {
  return typeof(candidate) == 'string' ? candidate : false;
}

helpers.validateStringByMinLength = (candidate, minLen=1) => {
  return (helpers.validateString(candidate) &&
    candidate.trim().length >= minLen) ?
      candidate : false;
}

helpers.validateStringByLength = (candidate, len) => {
  return (helpers.validateString(candidate) &&
    candidate.trim().length == len) ?
      candidate : false;
}

helpers.arraify = candidate => {
  return typeof(candidate) == 'object' &&
    candidate instanceof Array ? candidate : [];
};

helpers.colorLog = (message, color="", style="") => {

  const colors = {
    "black" : "\x1b[30m",
    "red" : "\x1b[31m",
    "green" : "\x1b[32m",
    "yellow" : "\x1b[33m",
    "blue" : "\x1b[34m",
    "magenta" : "\x1b[35m",
    "cyan" : "\x1b[36m",
    "white" : "\x1b[37m",
  };

  const styles = {
    "reset" : "\x1b[0m",
    "bright" : "\x1b[1m",
    "dim" : "\x1b[2m",
    "underscore" : "\x1b[4m",
    "blink" : "\x1b[5m",
    "reverse" : "\x1b[7m",
    "hidden" : "\x1b[8m",
  }

  const msgColor = typeof(colors[color]) == "string" ? colors[color] : "";
  const msgStyle = typeof(styles[style]) == "string" ? styles[style] : "";

  console.log(msgColor + msgStyle + "%s" + styles["reset"], message);
}

helpers.attemptPayment = (amount, source, description, callback) => {
  // Configure the request payload
    const payload = {
      "amount" : amount,
      "currency" : config.currency,
      "source" : source,
      "description" : description
    };

    // Stringify the payload
    const stringPayload = querystring.stringify(payload);

    const reqDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.stripe.com',
      'path' : '/v1/charges',
      'method' : 'POST',
      'auth' : config.stripe,
      'headers' : {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    const req = https.request(reqDetails, res => {

      /*
       * Response Status Code arrives before .on('data') event, and it is
       * generally enough to have response code 200 to deem the transaction
       * successful. However, it probably makes sense to wait another couple
       * hundred of milliseconds to get the entire Stripe "charge" object for
       * more granular evaluation of the outcome, and store the transaction id locally
       */
      res.on('data', data => {

        // Data comes as a buffer, which gets converted to string and then jsonified
        const dataJson = helpers.jsonify(data.toString());

        let ok = false;
        let outcomeType = "";

        if (res.statusCode == 200) {
          outcomeType = dataJson["outcome"]["type"];
          ok = outcomeType == "authorized";
          callback(!ok);
        } else {
          outcomeType = dataJson["error"]["type"];
          callback(res.statusCode);
        }

        helpers.colorLog(`Attempted payment: ${description} | Result: ${outcomeType.toUpperCase()}`, ok ? "green" : "red", "bright");
      });
    });

    req.on('error', e => {
      callback(e);
    });

    req.write(stringPayload);

    req.end();

};
// Helpers module exporting
module.exports = helpers;
