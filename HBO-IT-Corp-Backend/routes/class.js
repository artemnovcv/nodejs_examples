//File which contains the routes which are used to retrieve data for the class page.

const app = require('../app');
const moment = require('moment');
var jwt = require('jsonwebtoken');
var generatedTokens = {};
var express = require('express');
var app2 = express();
app2.set('jwt', 'secret');
let currentYear = moment(new Date()).format('YYYY');


//Setup the authentication so these routes can be used only with a valid token.

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
 * Route which is used to retrieve all classes.
 * @param req
 * @param res
 */
exports.getAllClasses = function (req, res) {
    app.pool.query(`SELECT * FROM public.class
                    order by name`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Route which is used to retrieve all students sorted by class.
 * @param req
 * @param res
 */
exports.getAllStudentSortedByClass = function (req, res) {
        app.pool.query(`SELECT * FROM public.student
                        left join geolocation
                        on studentcode = geolocation.student_id
                        ORDER BY public.student.class`, (err, results) => {
            res.status(200);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.json(results.rows);
        });
    };

/**
 * Get the schedule for a class along with the attendance for each lesson.
 * @param req
 * @param res
 */
exports.getSchedule = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, start_time, end_time, course."name", lesson.classes, "type", "date", lesson_id, course.id, count(student.studentcode) FROM public.lesson
                    right join student
                    on student.class = '${req.params.name}'
                    and classes::text LIKE '%${req.params.name}%'
                    left join attendance
                    on attendance.student_id = student.studentcode
                    and lesson_id = attendance.lesson_code
                    inner join course
                    on lesson.course_code = course.id
                    group by lesson_id, start_time, end_time, course.name, lesson.classes::text, "type", "date", course.id
                    order by lesson_id`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get all courses that a class is attending along with the attendance and grades for each one.
 * @param req
 * @param res
 */
exports.getCoursesForAClass = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, "name", ecc, quartile, "year", id, avg(grade."result") from course
                    left join classcourse
                    on classcourse.course_id = course.id
                    left join lesson 
                    on course.id = lesson.course_code
                    left join student
                    on classcourse.class_name = student.class
                    left join attendance
                    on attendance.student_id = student.studentcode
                    and attendance.lesson_code =lesson.lesson_id
                    and lesson.course_code = course.id
                    left join test
                    on test.course_id = lesson.course_code
                    left join grade
                    on grade.test_code = test.test_number
                    and student.studentcode = grade.student_id
                    where classcourse.class_name = '${req.params.classname}'
                    group by "name", ecc, quartile, "year", id`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the overall attendance for a class for this school year.
 * @param req
 * @param res
 */
exports.getAllAttendanceForAClass = function (req, res) {
    app.pool.query(`SELECT * FROM public.attendance 
                    INNER JOIN public.lesson
                    ON public.lesson.lesson_id = public.attendance.lesson_code
                    inner join student
                    on attendance.student_id = student.studentcode
                    and student.class = '${req.params.classname}'
                    inner join course
                    on lesson.course_code = course.id
                    and course."year" = '${currentYear}'
                    ORDER BY public.lesson.date`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the grades for a selected course.
 * @param req
 * @param res
 */
exports.getGradesForACourse = function (req, res) {
    app.pool.query(`SELECT COUNT(student_id), result, type, class FROM public.grade
                    INNER JOIN public.test
                    ON public.test.test_number = public.grade.test_code
                    INNER JOIN public.course
                    ON public.course.id = public.test.course_id
                    AND public.course.id = ${req.params.course}
                    INNER JOIN public.student
                    ON public.grade.student_id = public.student.studentcode
                    AND class = '${req.params.classname}'
                    GROUP BY public.grade.result, type, class
					ORDER BY result`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get all students for a class.
 * @param req
 * @param res
 */
exports.getStudentsForAClass = function (req, res) {
    app.pool.query(`select * from student
                    where class = '${req.params.classname}'`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        if (results) {
            res.json(results.rows);
        } else {
            res.send("gg");
        }
    });
};

/**
 * Get the overall attendance distance relation for a class.
 * @param req
 * @param res
 */
exports.getAttendanceDistanceForClass = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse,
                    case 
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 0.0 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 2.5)then '2.5'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 2.6 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 5.0)then '5.0'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 5.1 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 7.5)then '7.5'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 7.6 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 10.0)then '10.0'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 10.1 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 12.5)then '12.5'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 12.6 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 15.0)then '15.0'
                    ELSE '20'
                    end as summary
                    FROM geolocation
                    inner join attendance
                    on geolocation.student_id = attendance.student_id
                    inner join student
                    on geolocation.student_id = student.studentcode
                    and student.class = '${req.params.classname}'
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    inner join course
                    on course.id = lesson.course_code
                    where course.year = '${currentYear}'
                    group by summary
                    order by summary asc`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type");
        if (results) {
            res.json(results.rows);
        } else {
            res.send("gg");
        }
    });
};

/**
 * Get the attendance for a selected course along with attendance.
 * @param req
 * @param res
 */
exports.getClassAttendanceForACourse = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, lesson.week from attendance
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    and lesson.course_code = ${req.params.courseid}
                    inner join student
                    on attendance.student_id = student.studentcode
                    and student.class = '${req.params.classname}'
                    group by lesson.week`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        if (results) {
            res.json(results.rows);
        } else {
            res.send("gg");
        }
    });
};

/**
 * Get the attendance distance relation for a selected course.
 * @param req
 * @param res
 */
exports.getAttendanceDistanceForClassForCourse = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse,
                    case 
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 0.0 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 2.5)then '2.5'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 2.6 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 5.0)then '5.0'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 5.1 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 7.5)then '7.5'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 7.6 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 10.0)then '10.0'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 10.1 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 12.5)then '12.5'
                    when (NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric >= 12.6 and  NULLIF(regexp_replace(schooldistance, '[^0-9.]','','g'), '')::numeric <= 15.0)then '15.0'
                    ELSE '20'
                    end as summary
                    FROM geolocation
                    inner join attendance
                    on geolocation.student_id = attendance.student_id
                    inner join student
                    on geolocation.student_id = student.studentcode
                    and student.class = '${req.params.classname}'
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    and lesson.course_code = ${req.params.courseid}
                    group by summary
                    order by summary asc`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        if (results) {
            res.json(results.rows);
        } else {
            res.send("gg");
        }
    });
};

/**
 * Get all students for a class and for a selected course, along with their attendance and grades.
 * @param req
 * @param res
 */
exports.getStudentsForAClassWithInfo = function (req, res) {
    app.pool.query(`select first_name, last_name, studentcode, grade."result" as avg, SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse from student
                    inner join attendance
                    on attendance.student_id = student.studentcode
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    left join test
                    on test.course_id = ${req.params.coursecode}
                    left join grade
                    on grade.student_id = studentcode
                    and grade.test_code = test.test_number
                    where lesson.course_code = ${req.params.coursecode}
                    and class = '${req.params.classname}'
                    group by first_name, last_name, studentcode, grade."result"
                    order by studentcode`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        if (results) {
            res.json(results.rows);
        } else {
            res.send("gg");
        }
    });
};
