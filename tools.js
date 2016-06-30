"use strict";

const debug = require('debug')('tweetometro:tools')
const args = require('argsparser').parse();
const env = args['-env'] || "dev";
const conf = require("config");
const mongojs = require("mongojs");
const db = mongojs(conf.get("mongo.db"), conf.get("mongo.collections"));
const keywordsClass = require("./libs/keywords");
const hitsClass = require("./libs/hits");
const targetsClass = require("./libs/targets");
const adminsClass = require("./libs/admins");

const context = {
    db: db
    , args: args
};


const targets = new targetsClass(context);
const admins = new adminsClass(context);
const keywords = new keywordsClass(context);
const cmd = args['-cmd'] || "about";


const about = function () {
    console.log(" Tools v1.0 ");
    process.exit(0);
};

const admin = function () {
    let act = args['-act'] || "";

    let addAdmin = function () {
        let params = {
            email: args['-email'] || ""
            , password: args['-password'] || ""
        };


        if (params.email == "" || params.password == "") {
            console.log("faltan argumentos");
            return;
        }

        admins.add(params)
            .then(function (data) {
                console.log('Added ');
            }, function (err) {
                console.log('Error: ', err);
            });
    };

    switch (act) {
        case 'add':
            addAdmin();
            break;
        case '':
        default:
            console.log("Invalid ACT for Admin cmd: ", act);
            break;
    }
};


const target = function () {
    var act = args['-act'] || "";


    var add = function () {
        var params = {
            fname: args['-fname'] || ""
            , lname: args['-lname'] || ""
            , pol: args['-pol'] || ""
            , web: args['-web'] || ""
            , twitter: args['-twitter'] || ""
            , fanpage: args['-fanpage'] || ""
        }

        targets.add(params)
            .then(function (data) {
                console.log("Target added: ", data._id);
                process.exit(0);
            }, function (err) {
                console.log('Error: ', err);
                process.exit(1);
            });
    };


    var addkey = function () {
        var key = args['-key'] || "";
        var target = args['-target'] || "";
        if (key == "" || target == "") {
            console.log("No key, error");
            process.exit(1);
        }

        keywords.addKey(target, key)
            .then(function (dat) {
                console.log('keywords added: ', dat);
                process.exit(0);
            }, function (err) {
                debug(err);
                process.exit(1);
            });

    };

    switch (act) {
        case 'add':
            add();
            break;
        case 'key':
            addkey();
            break;
        case '':
        default:
            console.log("no act");
            break;
    }
};

console.log("CMD>", cmd);

switch (cmd) {
    case 'about':
        about();
        break;
    case 'target':
        target();
        break;
    case 'admin':
        admin();
        break;
}
