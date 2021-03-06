/*
 * Server-related tasks
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
const handlers = require('./handlers');
const helpers = require('./helpers');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const util = require('util');
const debug = util.debuglog('server');
const fs = require('fs');
const path = require('path');

const server = {};

// Instante the HTTP server
server.httpServer = http.createServer((req, res) => {
  server._server(req, res);
});

// HTTPS server options
server.httpsSrvOptions = {
  "key": fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  "cert": fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsSrvOptions, (req, res) => {
  server._server(req, res);
});

// Server logic for both http and https
server._server = (req, res) => {

  // Get the request data as an object
  const reqData = helpers.reqData(req);

  // Get the payload, if any
  const decoder = new stringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose the appropirate handler
    const handler =
      typeof(server.router[reqData.trimmedPath]) !== 'undefined' ?
      server.router[reqData.trimmedPath] : handlers.notFound;

    reqData.payload = helpers.jsonify(buffer);

    handler(reqData, (statusCode, payload) => {
      // Use the status code called back by the handler or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // debug(payload);

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      // res.end("Hello world\n");
      res.end(payloadString);

      if (statusCode == 200) {
        console.log('\x1b[32m%s\x1b[0m', `${reqData.method.toUpperCase()} /${reqData.trimmedPath} ${statusCode}`);
      } else {
        console.log('\x1b[31m%s\x1b[0m', `${reqData.method.toUpperCase()} /${reqData.trimmedPath} ${statusCode}`);
      }
    });
  });
};

// Init script
server.init = () => {
  // Start the server and have it listen on the port specified in the config
  server.httpServer.listen(config.httpPort, () => {
    helpers.colorLog(`The HTTP server is listening on port ${config.httpPort}`, "cyan");
  });

  server.httpsServer.listen(config.httpsPort, () => {
    helpers.colorLog(`The HTTPS server is listening on port ${config.httpsPort}`, "magenta");
  });
};

// Request router
server.router = {
  "users" : handlers.users,
  "tokens" : handlers.tokens,
  "menu" : handlers.menu,
  "cart" : handlers.cart,
  "orders": handlers.orders,
  "ping": handlers.ping
};


module.exports = server;
