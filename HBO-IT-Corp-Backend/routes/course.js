//File which contains the routes that are used in the course page.

const app = require('../app');
const moment = require('moment');
var jwt = require('jsonwebtoken');
var generatedTokens = {};
var express = require('express');
var app2 = express();
app2.set('jwt', 'secret');

//Setup the authorization so these routes can only be used with valid tokens.
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

/**
 * Get all courses.
 * @param req
 * @param res
 */
exports.getAllCourses = function (req, res) {
    app.pool.query(`SELECT * FROM public.course`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get all classes for a selected course along with the teacher and the attendance.
 * @param req
 * @param res
 */
exports.getAllClassesForCourse = function (req, res) {
    app.pool.query(`SELECT *
                    FROM (
                    SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, student.class,  teacher.first_name, teacher.last_name,ROW_NUMBER() OVER(PARTITION BY student.class) rn from attendance
                    inner join lesson 
                    on attendance.lesson_code = lesson.lesson_id
                    and lesson.course_code = ${req.params.courseid}
                    inner join course
                    on course.id = lesson.course_code
                    right join student
                    on student.studentcode = attendance.student_id
                    left join teacher
                    on lesson.teacher_code = teacher.code
                    group by student.class, lesson.teacher_code, teacher.first_name, teacher.last_name
                                  ) a
                    WHERE rn = 1`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get all teachers that are teaching a course.
 * @param req
 * @param res
 */
exports.getAllTeachersForACourse = function (req, res) {
    app.pool.query(`SELECT public.teacher.first_name, public.teacher.last_name,  public.course.name FROM public.teachercourse
    INNER JOIN public.course
    ON public.teachercourse.course_id = public.course.id
    AND public.course.id = ${req.params.courseid}
    INNER JOIN public.teacher
    ON public.teachercourse.teacher_code= public.teacher.code`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the overall attendance for a course. For this year and the last year(if there has been one).
 * @param req
 * @param res
 */
exports.getAllAttendanceForACourse = function (req, res) {

    app.pool.query(`SELECT * FROM public.attendance 
                    INNER JOIN public.lesson
                    ON public.lesson.lesson_id = public.attendance.lesson_code
                    inner join course
                    on lesson.course_code = course.id
                    and course."name" = '${req.params.courseid}'
                    where course."year" = '${moment(new Date()).format('YYYY')}'
                    or course."year" = '${moment(moment(new Date()).subtract(1, 'years')).format('YYYY')}'
                    ORDER BY lesson.week, lesson."date"`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Deprecated method.
 * @param req
 * @param res
 */
exports.getAttendanceForASelectedCourse = function (req, res) {
    app.pool.query(`SELECT * FROM public.attendance 
                    INNER JOIN public.lesson
                    ON public.lesson.lesson_id = public.attendance.lesson_code
                    AND public.lesson.course_code = ${req.params.courseid}
					AND student_id= ${req.params.studentid}
                    ORDER BY public.lesson.date`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get schedule for a selected course along with the attendance for each lesson.
 * @param req
 * @param res
 */
exports.getScheduleForASelectedCourse = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, start_time, end_time, course."name", lesson.classes, "type", "date", lesson_id, course.id, count(student.studentcode) FROM public.lesson
                    right join student
                    on lesson.classes::text like concat('%',student.class,'%')
                    left join attendance
                    on attendance.student_id = student.studentcode
                    and lesson_id = attendance.lesson_code
                    inner join course
                    on lesson.course_code = course.id
                    where course_code = ${req.params.courseid}
                    group by lesson_id, start_time, end_time, course.name, lesson.classes::text, "type", "date", course.id
                    order by lesson_id`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the attendance for all courses that a student attends.(used in student page)
 * @param req
 * @param res
 */
exports.getAttendanceForAllCoursesForStudent = function (req, res) {
    app.pool.query(`SELECT * FROM public.attendance 
                    INNER JOIN public.lesson
                    ON public.lesson.lesson_id = public.attendance.lesson_code
					AND student_id= ${req.params.studentid}
                    ORDER BY public.lesson.date`, (err, results) => {
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
 * Get all grades for a course.
 * @param req
 * @param res
 */
exports.getGradesForACourse = function (req, res) {
    app.pool.query(`SELECT COUNT(student_id), result, type, class FROM public.grade
                    INNER JOIN public.test
                    ON public.test.test_number = public.grade.test_code
                    INNER JOIN public.course
                    ON public.course.id = public.test.course_id
                    AND public.course.id = ${req.params.courseid}
                    INNER JOIN public.student
                    ON public.grade.student_id = public.student.studentcode
                    GROUP BY public.grade.result, type, class
					ORDER BY result`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get all lessons for a course.
 * @param req
 * @param res
 */
exports.getLessonsForACourse = function (req, res) {
    app.pool.query(`select * from lesson
                    inner join course
                    on course_code = course.id
                    where course.id = ${req.params.courseid}
                    order by date, start_time`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get all students for a lesson.
 * @param req
 * @param res
 */
exports.getStudentsForALesson = function (req, res) {
    app.pool.query(`select * from lesson
                    inner join course
                    on course_code = course.id
                    inner join class
                    on classes::text like concat('%',class."name",'%')
                    inner join student
                    on class."name" = student.class
                    full join attendance
                    on attendance."lesson_code" = lesson_id
                    and attendance."student_id" = studentcode
                    where lesson_id = ${req.params.lessonid}
                    order by date, start_time`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the attendance distance realation for the selected course.
 * @param req
 * @param res
 */
exports.getAttendanceBasedOnDistance = function (req, res) {
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
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    and lesson.course_code = ${req.params.courseid}
                    group by summary
                    order by summary asc`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the attendance distance relation for the course per lesson.
 * @param req
 * @param res
 */
exports.getAttendanceBasedOnDistancePerHour = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, lesson.start_time,
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
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    and lesson.course_code = ${req.params.courseid}
                    group by summary, lesson.start_time
                    order by lesson.start_time, summary asc `, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

