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
  } catch (e) {
    return {};
  }
};

helpers.arraify = candidate => {
  return typeof(candidate) == 'object' &&
  candidate instanceof Array ? candidate : [];
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
};

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
       * Response itself arrives before its .on('data') event, and it is
       * generally enough to check if its statusCode is 200 to deem the transaction
       * successful. However, it probably makes sense to wait another couple
       * hundred of milliseconds to get the entire Stripe "charge" object for
       * more granular evaluation of the outcome, and store the transaction id locally
       */
      res.on('data', data => {

        // Data comes as a buffer, which gets converted to string and then jsonified
        const dataJson = helpers.jsonify(data.toString());

        let outcomeType = "";
        let chargeId = "";

        let error = res.statusCode != 200 ? res.statusCode : false;

        if (error) {
          outcomeType = dataJson["error"]["type"];
          chargeId = dataJson["error"]["charge"];
        } else {
          outcomeType = dataJson["outcome"]["type"];
          chargeId = dataJson["id"];
        }

        const responseData = {
          chargeId, outcomeType
        };

        callback(error, responseData);
      });
    });

    req.on('error', e => {
      callback(e, {"outcomeType": "error"});
    });

    req.write(stringPayload);

    req.end();

};

helpers.attemptRefund = (chargeId, callback) => {
  const stringPayload = querystring.stringify({"charge" : chargeId});

  const reqDetails = {
    'protocol' : 'https:',
    'hostname' : 'api.stripe.com',
    'path' : '/v1/refunds',
    'method' : 'POST',
    'auth' : config.stripe,
    'headers' : {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringPayload)
    }
  };

  const req = https.request(reqDetails, res => {
    res.on('data', data => {


      let error = res.statusCode != 200 ? res.statusCode : false;
      const responseData = error ? "error" : "success";

      callback(error, responseData);
    });
  });

  req.on('error', e => {
    callback(e, "error");
  });

  req.write(stringPayload);
  req.end();
};

helpers.objectHasKeys = obj => {
  return Object.keys(obj).length > 0;
};

helpers.composeEmail = (emailAddress, orderData) => {

  const subject = `Your order with Pizza Delivery, #${orderData.id}`;
  const greeting = "Hey pizza lover!\n\n";
  const signature = "\n\nYours, Pizza Delivery.";
  let message = "Your order ";

  switch (orderData.status) {
    case "paid":

      message += "is confirmed and is being cooked right now.";

      let recip = "";
      orderData.items.forEach(item => {
        recip += item.name + " ".repeat(20 - item.name.length) + "|" +
          " ".repeat(5-String(item.qty).length) + item.qty + "pcs. |" +
          " ".repeat(6-String(item.price).length) + "$" + item.price + " |" +
          " ".repeat(10-String((item.price * item.qty).toFixed(2)).length) + "$" + (item.price * item.qty).toFixed(2) + "\n";
      });
      recip += "=".repeat(52) + "\n";
      recip += "Total:" + " ".repeat(45-String(orderData.total).length) +"$"+ orderData.total;

      message += "\n\nHere is your recip:\n\n";
      message += recip;

      message += "\n\nWe'll keep you updated about its further advancements."

      break;
    case "readyToShip":
      message += "is ready and shipping really soon!\n";
      break;
    case "shipped":
      message += "is on the way to you!\n";
      break;
    case "delivered":

      message = "Enjoy your meal and see you soon!";
      break;
    default:
      message = `Your order status: ${orderData.status}`;
  }

  return {
    "address" : emailAddress,
    "subject" : subject,
    "message" : greeting + message + signature
  };

};

helpers.sendEmail = (to, subject, emailMsgText, callback) => {
  const payload = {
    "from" : `Pizza Delivery <robot@${config.mailgun.domain}>`,
    "to" : to,
    "subject" : subject,
    "text" : emailMsgText
  };




  const stringPayload = querystring.stringify(payload);

  const reqDetails = {
    'protocol' : 'https:',
    'hostname' : 'api.mailgun.net',
    'path' : `/v3/${config.mailgun.domain}/messages`,
    'method' : 'POST',
    'auth' : `api:${config.mailgun.apiKey}`,
    'headers' : {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringPayload)
    }
  };

  const req = https.request(reqDetails, res => {
    res.on('data', data => {
      // Data comes as a buffer, which gets converted to string and then jsonified
      const dataJson = helpers.jsonify(data.toString());

      let error = res.statusCode != 200 ? res.statusCode : false;

      const responseData = dataJson;
      callback(error, dataJson);
    });
  });

  req.on('error', err => {
    callback(err);
  });

  req.write(stringPayload);
  req.end();

};


// Helpers module exporting
module.exports = helpers;
