/*
 * Create and export the configuration variables
 *
 */

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'gvdgbvhgtrdhj',
  'tokenValidity' : 1000 * 60 * 60 * 24 * 7, // 1 Week
  'tokenLength' : 20,
  'currency' : 'usd',
  'stripe' : '',
  'mailgun' : {
    'apiKey' : '',
    'domain' : ''
  }
};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : '6tfdsjsbvccty9esxsdtgferd1tga',
  'tokenValidity' : 1000 * 60 * 60 * 24 * 7, // 1 Week
  'tokenLength' : 20,
  'currency' : 'usd',
  'stripe' : '',
  'mailgun' : {
    'apiKey' : '',
    'domain' : ''
  }
};

// Determnine which environment has been passed as a
// command-line argument
const currEnv = typeof(process.env.NODE_ENV) == 'string' ?
  process.env.NODE_ENV.toLowerCase() : '';

// Check that the current env in some of the environmets above,
// if not, default to staging.
const envToExport = typeof(environments[currEnv]) == 'object' ?
  environments[currEnv] : environments.staging;

// Export the module
module.exports = envToExport;
