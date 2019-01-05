const app = require('../app');
var jwt = require('jsonwebtoken');
var generatedTokens = {};
var express = require('express');
var app2 = express();
app2.set('jwt', 'secret');

var getInfoFromToken = function (token) {
    var info = null;
    jwt.verify(token, app2.get('jwt'), function (err, infoFromToken) {
        if (err) {
            //console.log("error6") - indicates, that the token was corrupted
        } else {
            info = infoFromToken;
        }
    });
    return info;
}

var verifyToken = function (req, res, next) {
    var token = req.headers['token'];
    if (token) {
        var infoFromToken = getInfoFromToken(token);
        if (infoFromToken) {
            next();
        } else {
            res.status(403);
            res.json({message: "Problem with a token"});
        }
    } else {
        res.status(403);
        res.json({message: "No token provided"});
    }
};

module.exports.verifyToken = verifyToken;

exports.submitAttendance = function (req, res) {
    console.log('submitting attendance');
    let data = req.body;
    let values = "";
    let lesson = data.lesson_code;

    for(let i = 0; i < data.values.length; i++){
        let status = data.values[i].status;

        let student = data.values[i].student_id;
;
        let reason = data.values[i].reason;

        values += ("(" + status + ", " + student + ", " + lesson);
        if (status == 2){
            values += (", '" + reason + "'");
        } else {
            values += (", NULL");
        }
        values += ")";
        if (i < data.values.length - 1){
            values += ", "
        }
    }

app.pool.query("INSERT INTO attendance (status, student_id, lesson_code, reason) VALUES " + values +
                "ON CONFLICT (student_id, lesson_code) " +
                "DO UPDATE SET " +
                "status = EXCLUDED.status, " +
                "reason = EXCLUDED.reason ", (err, results) => {
    res.status(200);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(results);
});
};
