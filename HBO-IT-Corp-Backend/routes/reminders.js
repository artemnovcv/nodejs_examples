//File which contains the routes which are used for getting the attendance reminders for a teacher.

const app = require('../app');
var jwt = require('jsonwebtoken');
var generatedTokens = {};
var express = require('express');
var app2 = express();
app2.set('jwt', 'secret');
const moment = require('moment');

//Setup the authentication so these routes can only be used with valid tokens.

var getInfoFromToken = function (token) {
    var info = null;
    jwt.verify(token, app2.get('jwt'), function(err, infoFromToken) {
        if(err) {
            //console.log("error6") - indicates, that the token was corrupted
        } else {
            info = infoFromToken;
        }
    });
    return info;
}

var verifyToken = function(req, res, next){
    var token = req.headers['token'];
    if(token) {
        var infoFromToken = getInfoFromToken(token);
        if(infoFromToken) {
            next();
        } else {
            res.status(403);
            res.json({ message : "Problem with a token"});
        }
    } else {
        res.status(403);
        res.json({ message: "No token provided" });
    }
};

module.exports.verifyToken = verifyToken;

/**
 * Get tall reminders for a certain teacher. Reminders which are only for lessons that are for today are retrieved.
 * Only reminders for lessons which are in an hour or less from now are retrieved.
 * @param req
 * @param res
 */
exports.getAttendanceReminders = function (req, res) {
    console.log(`select * from lesson
                    inner join course
                    on course_code = course.id
                    where "date" = '${moment(req.params.time).format('YYYY-MM-DD')}'
                    and start_time > '${moment(req.params.time).format('HH:mm:ss')}'
                    and start_time < '${moment(moment(req.params.time).add(1, 'hour')).format('HH:mm:ss')}'
                    and teacher_code = ${req.params.teacherid}`);
    app.pool.query(`select * from lesson
                    inner join course
                    on course_code = course.id
                    where "date" = '${moment(req.params.time).format('YYYY-MM-DD')}'
                    and start_time > '${moment(req.params.time).format('HH:mm:ss')}'
                    and start_time < '${moment(moment(req.params.time).add(1, 'hour')).format('HH:mm:ss')}'
                    and teacher_code = ${req.params.teacherid}`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};
