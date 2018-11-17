/*
 * Library   for storing and editiing data
 *
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container to be exported
const lib = {};

// Base directory of the data flder
lib.baseDir = path.join(__dirname, '/../.data/');

// Read data from a file
lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {

    if (!err && data) {
      const parsedData = helpers.jsonify(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }
  });
};

// Write data to af file
lib.create = (dir, file, data, callback) => {
  // Open the file fore writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Convert data to a string
      const stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('Could not create new file, it may already exist');
    }
  });
};


module.exports = lib;
