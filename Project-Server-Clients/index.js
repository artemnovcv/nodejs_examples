var express = require('express');
var mysql = require('mysql');
var app = express();
var teacherRouter = require('./modules/teacher_module.js');
var studentRouter = require('./modules/student_module.js');
var courseRouter = require('./modules/course_module.js');
var attendenceRouter = require('./modules/attendence_module.js');


app.set('key', 'secretkey');
app.use(express.static('./2017-2018-Project-Server-Clients-EHI2VSo-Client'));

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
});

var con = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: 'password',
    database : 'projectserversclients'
});

app.use(express.static('public'));

app.listen(3000, function (err, result) {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected to server");

    }
});

 app.set('connection', con);

 app.use('/api/teacher', teacherRouter);
 app.use('/api/student', studentRouter);
 app.use('/api/course', courseRouter);
 app.use('/api/attendence', attendenceRouter);
