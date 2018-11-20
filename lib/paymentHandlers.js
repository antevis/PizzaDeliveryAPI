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

const charges = {
  "failed": "ch_1DYTQdBrGccsLYrj6gzBpPWm"

};

lib.post = (data, callback) => {
  helpers.attemptPayment(8999, testCards["visa"], 'test api payment', (err, responseData) => {
    if (!err) {
      callback(200);
    } else {
      callback(err);
    }
  });
};

lib.delete = (data,callback) => {
  helpers.attemptRefund("ch_1DYUG4BrGccsLYrj9JlzJ1Qo", err => {
    if (!err) {
      callback(200);
    } else {
      callback(err);
    }
  });
}


module.exports = lib;
