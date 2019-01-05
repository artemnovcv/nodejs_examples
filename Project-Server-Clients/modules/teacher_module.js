var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var db = require('./database_module');
var jwt = require('jsonwebtoken');
router.use(bodyParser.json());

// router.post('/addContent', function (req, res) {
//     db.query('INSERT INTO teacher(code, name, password) VALUES ("ABC1234","Johnson","password")', function (err, result) {
//         if (err) {
//             res.status(404);
//             res.end("Cant create teacher." + err)
//             return;
//         }
//         res.status(201);
//         res.end("added new teacher.");
//     });
// });

//api calls
//Adding data for testing
router.post('/addContent', function (req, res) {
    db.query('INSERT INTO teacher(code, name, password) VALUES ("439892","Jan Jaap Sandee","1234")', function (err, results) {
        if (err) {
            throw err;
            res.status(404);
            res.end("Can not insert the teacher.");
        }
        res.status(201);
        res.end();
    });
    db.query('INSERT INTO teacher(code, name, password) VALUES ("439891","Tristan Pothoven","5678")', function (err, results) {
        if (err) {
            throw err;
            res.status(404);
            res.end("Can not insert the teacher.");
        }
        res.status(201);
        res.end();
    });
});

router.post('/auth', function (req, res) {
    var query = 'SELECT * FROM teacher WHERE name = \"' + req.body.name + "\" LIMIT 1";
    console.log(query);
    db.query(query, function (err, results) {
        if (err || !results[0]) {
            res.status(400);
            res.json({ success: false, message: 'Authentication failed. User not found.' });
            return;
        }

        var teacher = results[0];
        console.log(teacher);
        if (req.body.password == teacher.password) {

            console.log("Password is fine");

            const payload = {
                admin: teacher.admin
            };
            var token = jwt.sign(payload, "secretKey", {});

            res.status(200);
            res.json({
                success: true,
                code: teacher.code,
                token: token
            });
        } else{

            res.status(400);
            res.json({success: false, message: 'Authentication failed. User not found.'});
            return;
        }
    });
});

/**
 * Function used to obtain all the teachers.
 */
router.get('/:coursecode', function (req, res) {
    var coursecode = req.params.coursecode;
    db.query("SELECT t.name,c.code FROM teacher t INNER JOIN teachercourse tc ON t.code=tc.teacher INNER JOIN course c ON tc.course= '"+coursecode+"' and tc.course=c.code ORDER BY t.name", function (err, results) {
        if (err) {
            res.status(404);
            res.end("No records found");
            return;
        }
        // console.log(results);
        res.status(200);
        res.json(results);
        res.end();
    });
});



/**
 * Function used to assign a teacher to a specific course to teach, using the teacher's code and the course's code.
 */
router.post('/:teacher/:course', function (req, res) {
    var teacherCode = req.params.teacher;
    var courseCode = req.params.course;
    db.query('INSERT INTO teachercourse (teacher, course) VALUES ("' + teacherCode + '","' + courseCode + '")', function (err, results) {
        if (err) {
            res.status(403);
            res.end("Can't add the teacher with the teacherCode: " + teacherCode + " \n to courseCode: " + courseCode + " err: " + err);
            return;
        }
        //console.log(results);
        res.status(201);
        res.json(results);
        res.end();
    });
});

/**
 * Function that is used to delete a course from a teacher's teaching classes.
 */
router.delete('/:teacher/:course', function (req, res) {
    var teacherCode = req.params.teacher;
    var courseCode = req.params.course;
    db.query("DELETE FROM teachercourse WHERE (teacher LIKE '" + teacherCode + "') AND (course LIKE  '" + courseCode + "')", function (err, results) {
        if (err) {
            res.status(404);
            res.end("Can't delete " + courseCode + " from teacherCode: " + teacherCode + "err: " + err);
            return;
        }
        //console.log(results);
        res.status(200);
        res.json(results);
        res.end();
    });

});


/**
 * FUNCTION: Get the teachers manage a course (input: course code)
 */
router.get('/:course', function (req, res) {
    var course = req.params.course;
    db.query("SELECT name FROM teacher t INNER JOIN teachercourse tc ON t.code=tc.teacher INNER JOIN course c ON tc.course=c.code AND c.code='" + course + "' GROUP BY t.name", function (err, result, fields) {
        if (err) {
            res.status(404);
            res.json({ message: "Cannot get the teachers" });
            throw err;
        }
        console.log(result);
        res.status(200);
        res.json(result);
    })
});

// exports the functions to index.js
module.exports = router;