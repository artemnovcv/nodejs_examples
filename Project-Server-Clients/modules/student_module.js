//init required modules
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var db = require('./database_module');

// forces to read body

router.use(bodyParser.json());

//Api call for students

//Adding data for testing
router.post('/addContent', function (req, res)  {
    db.query('INSERT INTO student(code, firstname, lastname) VALUES ("439892","Nhi","Do")', function (err, results){
        if (err) {
            res.status(404);
            res.end("Can not insert the student.");
            throw err;
        }
        res.status(201);
        res.end();
    });
});

router.get('/', function (req, res) {

    db.query("SELECT * FROM student", function (err, result, fields) {
        if (err) {

            res.status(404);
            res.json({message: "Couldn't get students for class"});
            console.log('Api for students was called but couldnt find students for this class');
            throw err;
        }
        res.status(201);
        console.log(result);
        res.json(result);
    });
});

router.get('/getavg/:course', function (req, res) {
    var class_k = req.params.class;
    var course = req.params.course;
    db.query("select avg(b.grade) avg,c.class from grade b join course a join studentclass c on a.yearquartile=2017 and a.code=1 and a.code=b.course and b.student=c.student group by c.class",function (err, result, fields) {
        if (err){
            res.status(404);
            res.header('Access-Control-Allow-Origin', "*");
            res.json({message: "Cannot get an average student's grade"});
            return;
        }
        console.log(result);
        res.status(200);
        res.json(result);
    })
});


router.get('/show/:course/:student', function (req, res) {
    var student = req.params.student;
    var course = req.params.course;
    db.query("select grade from grade where student="+student+" and course="+course,function (err, result, fields) {
        if (err){
            res.status(404);
            res.json({message: "Cannot get a student's grade"});
            throw err;
        }
        console.log(result);
        res.status(200);
        res.json(result);
    })
});



router.get('/update/:course/:student/:grade', function (req, res) {
    var student = req.params.student;
    var course = req.params.course;
    var grade = req.params.grade;
    db.query("update grade set grade="+grade+" where student="+student+" and course="+course,function (err, result, fields) {
        if (err){
            res.status(404);
            res.json({message: "Cannot update a student's grade"});
            throw err;
        }
        console.log(result);
        res.status(200);
        res.json(result);
    })
});


router.get('/remove/:course/:student/:grade', function (req, res) {
    var student = req.params.student;
    var course = req.params.course;
    var grade = req.params.grade;
    db.query("delete from grade where student="+student+" and course="+course+" and grade="+grade,function (err, result, fields) {
        if (err){
            res.status(404);
            res.json({message: "Cannot remove a student's grade"});
            throw err;
        }
        console.log(result);
        res.status(200);
        res.json(result);
    })
});
module.exports = router;
