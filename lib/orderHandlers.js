/*
 * Order handling methods
 *
 */

/*

Orders are based on the current state of the Shopping cart. That said, updating
of the orders is meanigless and should be performed through deleting the order
(if possible) and creating a new one.

Orders' lifecycles are simulated by a dedicated worker running on the server,
that 'ages' the orders over time, generating a history of statuses, making
them eventually non-refundable as statuses become 'delivered'.

}
Order statuses:
-accepted (unpaid -> non-refundable): GET, DELETE
-rejected (unpaid -> non-refundable): GET, DELETE
-paid (refundable): GET, DELETE
-ready to ship (refundable): GET, DELETE
-shipped (refundable): GET, DELETE
-delivered (non-refundable): GET
-canceled:
*/


// Dependencies
const validator = require('./validators');
const helpers = require('./helpers');
const _data = require('./data');
const config = require('./config');
const tokenHandlers = require('./tokenHandlers');


const lib = {};

// POST
// Required data:
//  token (headers)
//  payment data (payload)
// Optional data: none
lib.post = (data, callback) => {
  const paymentCreds = validator.validateStringByMinLength(data.payload.cardData);

  if (paymentCreds) {

    tokenHandlers.userByTokenId(data.headers.token, (err, userData) => {
      if (!err && userData) {
        const cart = typeof(userData.cart) == 'object' ? userData.cart : false;

        if (cart) {

          validator.validateOrder(cart, (err, orderData) => {
            if (!err && orderData) {

              const orderId = helpers.createRandomString(config.tokenLength);
              orderData.id = orderId;
              orderData.email = userData.email;
              orderData.statusHistory = {
                "accepted" : Date.now()
              };
              orderData.status = "accepted";

              const orderDesc = `Payment for order ${orderId}`;
              helpers.attemptPayment(Math.round(orderData.total * 100.0), paymentCreds, orderDesc, (err, chargeData) => {

                orderData.chargeId = chargeData.chargeId;

                if (!err) {
                  // Add 'paid' to order history
                  orderData.statusHistory.paid = Date.now();
                  // Change status to 'paid'
                  orderData.status = "paid";

                  // Add orderId to user's object 'orders'
                  const orders = helpers.arraify(userData.orders);
                  orders.push(orderId);
                  userData.orders = orders;
                  // Delete user's 'cart'
                  delete userData.cart;

                  // Save the user
                  _data.update('users', userData.email, userData, err => {
                    if (err) {
                      helpers.colorLog(`Error: failed to add order to the user: ${email} orderId: ${orderData.id}`, "red");
                    }
                  });

                } else {
                  // Add 'rejected' to status history
                  orderData.statusHistory.rejected = Date.now();
                  // Change status to 'rejected'
                  orderData.status = "rejected";
                }

                // Save the order
                _data.create('orders', orderId, orderData, err => {
                  if (err) {
                    helpers.colorLog(`Error: Failed to update the order status. Order ID: ${orderData.id}`, "red");
                  }
                });

                callback(err ? err : 200);
              });
            } else {
              // This is a server-side error since cart data being taken from the
              // user object where it lands after prior validation
              callback(500, {"Error" : "Failed to populate order with the items from the cart."});
            }
          });
        } else {
          callback(403, {"Error" : "No valid Shopping Cart exists for the user."});
        }

      } else {
        callback(err, userData);
      }
    });
  } else {
    callback(400, {"Error" : "Missing payment credentials."});
  }
};

// GET
// Required data:
//  token (headers)
//  orderId (queryString). Users get it with an email recipt.
// Optional data: none
lib.get = (data, callback) => {

  const orderId = validator.validateStringByLength(data.queryStringObject.id, config.tokenLength);

  if (orderId) {
    tokenHandlers.userByTokenId(data.headers.token, (err, data) => {
      if (!err && data) {
        if (data.orders.indexOf(orderId) > -1) {
          _data.read('orders', orderId, (err, orderData) => {
            if (!err && orderData) {

              if (orderData.status != "canceled") {
                delete orderData.email;
                delete orderData.chargeId;

                callback(200, orderData);
              } else {
                callback(400, {"Error" : "Can't return the order due to its status."});
              }

            } else {
              callback(500, {"Error" : "Order not found."});
            }
          });
        } else {
          callback(400, {"Error" : "No order with this ID associated with the user."});
        }
      } else {
        callback(err, data);
      }
    });
  } else {
    callback(400, {"Error" : "Missing reqired field in the query."});
  }
};

// DELETE
// * Changes the order status to 'canceled' it possible (not delivered yet) rather
//   than physically removes the order file and its associated records.
// * If canceled, refunds the order amount if it is paid.
// Required data:
//  token (headers)
//  orderId (queryString)
// Optional data: none
lib.delete = (data, callback) => {
  const tokenId = validator.validateStringByLength(data.headers.token, config.tokenLength);
  const orderId = validator.validateStringByLength(data.queryStringObject.id, config.tokenLength);

  if (tokenId && orderId) {
    _data.read("orders", orderId, (err, orderData) => {
      if (!err && orderData) {

        const cancellable = (["accepted", "paid", "readyToShip", "shipped"].indexOf(orderData.status) > -1);
        const refundable = (["paid", "readyToShip", "shipped"].indexOf(orderData.status) > -1);

        if (cancellable) {
          // Change order status to 'canceled'
          orderData.status = "canceled"
          orderData.statusHistory.canceled = Date.now();

          // Refund if applicable
          if (refundable) {
            const chargeId = orderData.chargeId;

            // Refund.
            helpers.attemptRefund(orderData.chargeId, (err, responseData) => {

              if (!err) {
                // Save the order
                _data.update("orders", orderId, orderData, err => {
                  if (!err) {
                    helpers.colorLog(`Changed the order ${orderId} status to cancelled`, "green");
                  } else {
                    helpers.colorLog(`Failed to change the order ${orderId} status to cancelled`, "red");
                  }
                });
                callback(200);
              } else {
                callback(err, {"Error" : "Failed to refund. Not deleting the order."});
              }
            });
          } else {
            // Save the order right away
            _data.update("orders", orderId, orderData, err => {
              if (!err) {
                callback(200);
              } else {
                callback(500, {"Error" : "Failed to delete the order."})
              }
            });
          }
        } else {
          callback(403, {"Error" : "Can't delete the order due to its status."});
        }
      } else {
        callback(500, {"Error" : "Order not found."});
      }
    });
  } else {
    callback(400, {"Error" : "Missing token or reqired field in the query."});
  }
};






module.exports = lib;
