"use strict";

const debug = require("debug")("tweetometro:monitor");
const args = require('argsparser').parse();
const env = args['-env'] || "dev";
const conf = require("config");
const mongojs = require("mongojs");
const db = mongojs(conf.get("mongo.db"), conf.get("mongo.collections"));
const keywordsClass = require("./libs/keywords");
const hitsClass = require("./libs/hits");
const Twitter = require('node-twitter');


var context = {
  db: db
    ,args: args

};


const keywords = new keywordsClass(context);
const hits = new hitsClass(context);




var twitterStreamClient = new Twitter.StreamClient(
    conf.get("twitter.CONSUMER_KEY"),
    conf.get("twitter.CONSUMER_SECRET"),
    conf.get("twitter.TOKEN"),
    conf.get("twitter.TOKEN_SECRET")
);



twitterStreamClient.on('close', function() {
    console.log('Connection closed.');
});

twitterStreamClient.on('end', function() {
    console.log('End of Line.');
});

twitterStreamClient.on('error', function(error) {
    console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
});


var trackKeywords = [];
var tweetsStore = [];

var tAction = function(tweet){
    var keys = [];

    for(var x=0; x<trackKeywords.length; x++){
        if(tweet.text.toLowerCase().indexOf(trackKeywords[x].toLowerCase())>-1){
            console.log("TWEET: >", tweet.text, trackKeywords[x]);
            keys.push(trackKeywords[x]);
        }
    }//end for

    tweet.keywords = keys;
    tweet.process = false;

    debug("hit: "+ tweet.text +' ['+ tweet.keywords.join()+']');
    tweetsStore.push(tweet);
};


const saveController = function(){
    var tweet = tweetsStore.shift();
    hits.save(tweet)
        .then(function(){

        }, function(err){
            debug('Error OOT500');
        });
    if(tweet) db.hits.save(tweet);
};

setInterval(saveController, 100);




keywords.loadKeywords()
    .then(function(keys){
        console.log('Tracking: ', keys);

        for(var k in keys) trackKeywords.push( k );

        if(trackKeywords.length>0){
            twitterStreamClient.on('tweet', tAction);
            twitterStreamClient.start(trackKeywords);
        }else{
            console.log('Use tools.js file for add targets/keywords ');
            process.exit(1);
        }

    }, function(err){
        debug('Error: not keywords setters');
    });

