/*
 * Handlers definintion
 *
 */

// Define the handlers
const handlers = {};

handlers.notFound = (data, callback) => {
  callback(404);
};

module.exports = handlers;
