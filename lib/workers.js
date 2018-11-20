/*
 * Worker to simulate the orders lifecycles
 *
 */



// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

const lib = {};

// 1. get previously tracked orders from trackedOrders.json.
const trackedOrdersLoader = (callback) => {
  _data.read('orders', 'trackedOrders', (err, ordersData) => {
    if(!err && ordersData && ordersData instanceof Array) {
      callback(false, ordersData);
    } else {
      const trackedOrders = [];
      _data.create('orders', 'trackedOrders', trackedOrders, err => {
        if(!err) {
          callback(false, trackedOrders)
        } else {
          callback(err, {"Error" : "Failed to create the file for tracked orders"});
        }
      });
    }
  });
};

// 2. List all orders
const listOrders = (callback) => {
  _data.list('orders', (err, orders) => {

    if (!err && orders && orders.length > 0) {
      const orderObjects = [];

      orders.forEach(order => {

        const orderData = _data.readSync('orders', order);
        if (orderData != {} && typeof(orderData.id) == "string") {
          orderObjects.push(orderData);
        }
      });
      callback(false, orderObjects);
    } else {
      callback(err);
    }
  });
}

const collectActiveOrders = () => {

  // 1. get previously tracked orders from trackedOrders.json.
  trackedOrdersLoader((err, trackedOrders) => {

    if (!err && trackedOrders) {
      // Get the list of tracked orders IDs.
      const trackedOrderIds = trackedOrders.map(x => x.id);
      // 2. List all orders
      listOrders((err, orders) => {
        if (!err && orders) {
          // 3. Of each listed order, inspect its status property.
          //   If it is not "delivered","rejected","canceled" and the order is not in tracked orders, add it.
          orders.forEach(order => {

            if (["delivered","rejected","canceled"].indexOf(order.status) == -1 && trackedOrderIds.indexOf(order.id) == -1)  {
                trackedOrders.push(order);
            }
          });

          // 4. "Age" all tracked orders by one stage, up to the "delivered".
          const stages = ["accepted","paid","readyToShip","shipped","delivered"];

          trackedOrders.forEach(order => {

            let currentStageIdx = stages.indexOf(order.status);

            // >= 0 just in case.
            if (currentStageIdx >= 0 && currentStageIdx < stages.length-1) {
              currentStageIdx++;
            }

            order.status = stages[currentStageIdx];

            console.log(`${Date.now()}: Order ID: ${order.id}, Status: ${order.status}`);

            _data.update('orders', order.id, order, err => {
              if (err) {
                console.log("Error: Failed to update the order status.");
              }
            });
          });

          // Remove delivered orders from further "aging"
          let i = trackedOrders.length;
          while (i--) {
            if (trackedOrders[i].status == "delivered") {
              trackedOrders.splice(i, 1);
            }
          }

          // 5. Save tracked orders.
          _data.update('orders', 'trackedOrders', trackedOrders, err => {
            if (err) {
              console.log("Failed to update tracked orders.");
            }
          });
        } else {
          console.log("Error: Could not find orders to process");
        }
      });
    } else {
      console.log("Failed to setup orderTracking");
    }
  });
};

const loop = () => {
  setInterval(() => {
    collectActiveOrders();
  }, 1000 * 10);
};

lib.init = () => {

  collectActiveOrders();

  loop();
};


module.exports = lib;
