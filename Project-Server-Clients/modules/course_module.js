
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var db = require('./database_module');
router.use(bodyParser.json());

//api calls

/*
Function used to add some dummy data into the database.
 */
// router.post('/addContent', function (req, res) {
//     db.query('INSERT INTO course(code, name, ecs, year) VALUES ("ACAA","test course",4, 1997)', function (err, results) {
//         if (err) {
//             throw err;
//             res.status(404);
//             res.end("Can not insert the course.");
//         }
//         res.status(200);
//         res.end();
//     });
// });
//Adding data for testing
router.post('/addContent', function (req, res) {
    db.query('INSERT INTO course(code, name, ecs, year) VALUES ("ACAA","test course",4, 1997)', function (err, results) {
        if (err) {
            res.status(404);
            res.end("Can not insert the course.");
            throw err;
        }
        res.status(200);
        res.end();
    });
});
//Adding data for testing
router.post('/addContents', function (req, res) {
    db.query('INSERT INTO prerequisite(course, prerequisite_course) VALUES ("ACAA","Web Technology")', function (err, results) {
        if (err) {
            res.status(404);
            res.end("Can not insert the course.");
            throw err;
        }
        res.status(200);
        res.end();
    });
    db.query('INSERT INTO prerequisite(course, prerequisite_course) VALUES ("ACAA","Databases")', function (err, results) {
        if (err) {
            res.status(404);
            res.end("Can not insert the course.");
            throw err;
        }
        res.status(200);
        res.end();
    });
    db.query('INSERT INTO competence(code, name, level) VALUES ("1234","Programming",1)', function (err, results){
        if (err) {
            throw err;
            res.status(404);
            res.end("Can not insert the course.");
        }
        res.status(200);
        res.end();
    });
});

/**
 * Function used to obtain all the courses.
 */
router.get('/', function (req, res) {
    db.query('SELECT * FROM course', function (err, results) {
        if (err) {
            res.status(404);
            res.end("No course records found");
            return;
        }
        //console.log(results);
        res.status(200);
        res.json(results);
        res.end();
    });
});

/**
 * Function used to obtain the courses that a teacher teaches by the means of the teacher's code.
 */
router.get('/:teacher', function (req, res) {
    var teacherCode = req.params.teacher;
    db.query("SELECT * FROM course JOIN teachercourse ON teachercourse.course = course.code  WHERE teachercourse.teacher LIKE '" + teacherCode + "'", function (err, results) {
        if (err) {
            res.status(404);
            res.json(err);
            res.end("No courses that match that teacher.");
            return;
        }
        res.status(200);
        res.json(results);
        res.end();
    });
});

/**
 * FUNCTION: Get pre-requisite courses of a course (input: course code)
 */
router.get('/prerequisite/:course', function (req, res) {
    var course = req.params.course;
    db.query("SELECT prerequisite_course FROM prerequisite WHERE course='"+course+"'",function (err, result, fields) {
        if (err){
            res.status(404);
            res.json({message: "Cannot get prerequisite courses"});
            return;
        }
        console.log(result);
        res.status(200);
        res.json(result);
    })
});

/**
 * FUNCTION: Get competences of a course (input: course code)
 */
router.get('/competence/:course', function (req, res) {
    var course = req.params.course;
    db.query("SELECT ct.name FROM competence ct INNER JOIN competencecourse cc ON ct.code=cc.competence INNER JOIN course c ON cc.course=c.code WHERE c.code='"+course+"'",function (err, result, fields) {
        if (err){
            res.status(404);
            res.json({message: "Cannot get prerequisite courses"});
        }
        console.log(result);
        res.status(200);
        res.json(result);
    })
});

/**
 * FUNCTION: Get changes of a course (input: course code)
 */
router.get('/change/:course', function (req, res) {
    var course = req.params.course;
    db.query("SELECT id FROM change ch INNER JOIN coursechange cc ON ch.id=cc.change INNER JOIN course c ON cc.course=c.code WHERE c.code='"+course+"'",function (err, result, fields) {
        if (err){
            res.status(404);
            res.json({message: "Cannot get the course changes"});
            throw err;
        }
        console.log(result);
        res.status(200);
    })
});

router.get('/difficulty/:course', function (req, res) {
    var course = req.params.course;
    console.log(course);
    var query = "SELECT difficulty FROM evaluation JOIN evaluation_form ON evaluation_form.id = evaluation.form JOIN course ON evaluation_form.course = course.code WHERE course.code = '" + course + "'";
    console.log(query);
    db.query(query, function (err, result) {
        if (err || result == undefined) {
            res.status(404);
            res.json("Cannot get difficulty of the given course");
            res.end();
            return;
        }

        var i;
        var total = 0;
        for (i = 0; i < result.length; i++) {
            total += result[i].difficulty
        }

        var average = total/i;
        res.status(200);
        res.json(average);
    })
});

// exports the functions to index.js
module.exports = router;