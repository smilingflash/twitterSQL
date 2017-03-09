// setting up the node-postgres driver

var pg = require('pg');
var postgresUrl = 'postgres://localhost/twitterdb';
var client = new pg.Client(postgresUrl);

// connecting to the `postgres` server

client.connect((err, ok) => {
  if (err) console.error(err)
  console.log("We're connected to the db!")
});

// make the client available as a Node module

module.exports = client;
