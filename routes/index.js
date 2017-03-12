'use strict';
const express = require('express');
const router = express.Router();
// const tweetBank = require('../tweetBank');
const client = require('../db');

module.exports = function makeRouterWithSockets(io) {

    // a reusable function
    function respondWithAllTweets(req, res, next) {
        client.query('SELECT tweets.id AS tweet_id, * FROM tweets INNER JOIN users ON users.id = tweets.user_id', function(err, result) {
            if (err) return next(err); // pass errors to Express
            var tweets = result.rows;
            res.render('index', {
                title: 'Twitter.js',
                tweets: tweets,
                showForm: true
            });
        });
    }

    // here we basically treet the root view and tweets view as identical
    router.get('/', respondWithAllTweets);
    router.get('/tweets', respondWithAllTweets);

    // single-user page
    router.get('/users/:username', function(req, res, next) {
        const name = req.params.username;
        client.query('SELECT tweets.id AS tweet_id, * FROM tweets INNER JOIN users ON users.id = tweets.user_id WHERE users.name =$1', [name], function(err, result) {
            if (err) return next(err);
            var tweets = result.rows;
            res.render('index', {
                title: 'Twitter.js',
                tweets: tweets,
                showForm: true,
                username: req.params.username
            })
        })
    });

    // single-tweet page
    router.get('/tweets/:id', function(req, res, next) {
        client.query('SELECT tweets.id AS tweet_id, * FROM tweets INNER JOIN users ON users.id=tweets.user_id WHERE tweets.id=$1', [req.params.id], function(err, result) {
            if (err) return next(err);
            console.log(result.rows)
            res.render('index', {
                title: 'Twitter.js',
                tweets: result.rows,
                showForm: true
            })
        })
    });

    // create a new tweet
    router.post('/tweets', function(req, res, next) {
        client.query('SELECT * FROM users WHERE users.name = $1', [req.body.name], checkUserId);

        function checkUserId(err, result) {
            if (err) return next(err);
            if (!result.rows.length) makeNewUser();
            else insertTweet(null, result);
        }

        function makeNewUser() {
            const newPicture = 'http://lorempixel.com/48/48?name=' + req.body.name;
            client.query('INSERT INTO users (name, picture_url) VALUES ($1, $2) RETURNING *', [req.body.name, newPicture], insertTweet);
        }
        /* eslint-disable camelcase */
        function insertTweet(err, result) {
            if (err) return next(err);
            const user_id = result.rows[0].id;
            client.query('INSERT INTO tweets (user_id, content) VALUES ($1, $2) RETURNING *', [user_id, req.body.content], sendFinalResponse);
        }
        /* eslint-enable camelcase */

        function sendFinalResponse(err) {
            if (err) return next(err);
            res.redirect('/');
        }
        // function(err, result) {
        //     client.query('INSERT INTO tweets (user_id, content) VALUES ($1, $2)', [result.rows[0].id, req.body.content], function(err, result) {
        //         if (err) return next(err);
        //         var newTweet = result.rows;
        //         io.sockets.emit('new_tweet', newTweet);
        //         res.redirect('/');
        //     })
        // })
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