var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var con;



function connectDatabase() {
    if (!con) {
        con = mysql.createConnection({
            host: "localhost",
            user: 'root',
            password: 'password',
            database: 'projectserversclients'

        });

        con.connect(function (err) {
            if (err) throw err;
            console.log("Connected to db");
        });
        return con;
    }
}

module.exports = connectDatabase();