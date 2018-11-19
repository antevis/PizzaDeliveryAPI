/*
 * Payment handling methods
 *
 */

// Dependencies
const helpers = require('./helpers');

const lib = {};

const testCards = {
  "visa" : "tok_visa",
  "cardDeclined" : "tok_chargeDeclined",
  "noFunds" : "tok_chargeDeclinedInsufficientFunds",
  "expired" : "tok_chargeDeclinedExpiredCard"
};

lib.post = (data, callback) => {
  helpers.attemptPayment(8999, testCards["visa"], 'test api payment', (err, responseData) => {
    if (!err) {
      callback(200);
    } else {
      callback(err);
    }
    console.log(responseData["chargeId"]);
  });
};


module.exports = lib;
