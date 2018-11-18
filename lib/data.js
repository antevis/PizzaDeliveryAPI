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

// Update data inside a file
lib.update = (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) =>{
    if (!err && fileDescriptor) {
      const stringData = JSON.stringify(data);
      // Truncate the file (because there might be already something in it)
      fs.truncate(fileDescriptor, err => {
        if(!err) {
          // Write to the file and close it
          fs.writeFile(fileDescriptor, stringData, err => {
            if(!err) {
              fs.close(fileDescriptor, err => {
                if (!err) {
                  callback(false);
                } else {
                  callback("Error closing existing file");
                }
              });
            } else {
              callback("Error writing to existing file");
            }
          });
        } else {
          callback("Error truncating the file");
        }
      });
    } else {
      callback("Couldn't open the file for updating, it may not exist yet.");
    }
  });
};

// Delete a file
lib.delete = (dir, file, callback) => {
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', err => {
    if (!err) {
      callback(false);
    } else {
      callback("Error deleting the file")
    }
  });
};


module.exports = lib;
