//File which contains the routes for the evaluation page.

const app = require('../app');
var jwt = require('jsonwebtoken');
var generatedTokens = {};
var express = require('express');
var app2 = express();
app2.set('jwt', 'secret');

//Set up the authentication so these routes can only be used with valid tokens.

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
 * Get all years for which there are courses.
 * @param req
 * @param res
 */
exports.getAllYears = function (req, res) {
    app.pool.query(`select distinct year from course`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get all courses.
 * @param req
 * @param res
 */
exports.getAllCourses = function (req, res) {
    app.pool.query(`select * from course`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the average hours spent, average difficulty and the average usefulness for a course.
 * @param req
 * @param res
 */
exports.getAverages = function (req, res) {
    app.pool.query(`select avg(hours_spent) hours, avg(diffuculty) diffuculty, avg(usefulness) usufulness from evaluation
                    where "course_Id" = ${req.params.courseid}`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the average hours spent, average difficulty and the average usefulness for all courses except the one that we are
 * comparing them to.
 * @param req
 * @param res
 */
exports.getAllAverages = function (req, res) {
    app.pool.query(`select avg(hours_spent) hours, avg(diffuculty) diffuculty, avg(usefulness) usufulness from evaluation
                    where not "course_Id" = ${req.params.courseid}`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the average hours spent, average difficulty and the average usefulness for course per class.
 * @param req
 * @param res
 */
exports.getAveragesByClass = function (req, res) {
    app.pool.query(`select avg(hours_spent) hours, avg(diffuculty) diffuculty, avg(usefulness) usufulness, class_id as class from evaluation
                    where "course_Id" = ${req.params.courseid}
                    group by class_id`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the percentage of the people who have filled evaluation forms.
 * @param req
 * @param res
 */
exports.getPercentage = function (req, res) {
    let fullData = [[],[]];
    //Get the amount of evaluation forms that were submitted per class.
    app.pool.query(`select count(class_id), class_id as class from evaluation
                    where "course_Id" = ${req.params.courseid}
                    group by class_id`, (err, results) => {
        //Store the data.
        fullData[0].push(results.rows);
        //Get the amount of students per class.
        app.pool.query(`select count(class), class from student
                    group by class`, (err, results) => {
            //Store the data.
            fullData[1].push(results.rows);
            res.status(200);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.json(fullData);
        });
    });

};
