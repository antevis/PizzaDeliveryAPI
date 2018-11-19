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
  helpers.attemptPayment(8999, testCards["visa"], 'test api payment', (err) => {
    if (!err) {

      // console.log(responseData);
      callback(200);
    } else {
      callback(err);
    }
  });
};


module.exports = lib;
