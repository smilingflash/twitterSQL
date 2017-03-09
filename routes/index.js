'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db');

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    client.query('SELECT *, users.name FROM tweets JOIN users on tweets.user_id = users.id', function (err, result) {
        if (err) return next(err); // pass errors to Express
        var tweets = result.rows;
        //console.log(result.rows);
        res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
      });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query('SELECT * FROM users JOIN tweets ON tweets.user_id = users.id WHERE name =$1',[req.params.username], function (err,result){
      if (err) return next(err);
      var tweets = result.rows;

      res.render('index', { title: req.params.username , tweets: tweets, showForm: false})
    })

    // var tweetsForName = tweetBank.find({ name: req.params.username });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsForName,
    //   showForm: true,
    //   username: req.params.username
    // });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    client.query('SELECT * FROM tweets JOIN users ON tweets.user_id = users.id WHERE tweets.id =$1',[req.params.id], function (err,result){
      if (err) return next(err);
      var tweetsWithThatId = result.rows;
      res.render('index', { title: 'Twitter.js' , tweets: tweetsWithThatId, showForm: false})
    })// var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsWithThatId // an array of only one element ;-)
    // });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    client.query('SELECT users.id FROM users JOIN tweets on tweets.user_id = users.id WHERE users.name = $1',[req.body.name], function(err, result) {
      // console.log(result)
      client.query('INSERT INTO tweets (user_id, content) VALUES ($1, $2)', [result.rows[0].id, req.body.content], function(err, result) {
        if (err) return next(err);
          var newTweet = result.rows;
          io.sockets.emit('new_tweet', newTweet);
          res.redirect('/');
      })
    })
    // var newTweet = tweetBank.add(req.body.name, req.body.content);
    // io.sockets.emit('new_tweet', newTweet);
    // res.redirect('/');
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
