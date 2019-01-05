const app = require('../app');
var jwt = require('jsonwebtoken');
const moment = require('moment');
var generatedTokens = {};
var express = require('express');
var app2 = express();
app2.set('jwt', 'secret');


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
 * Get all of the information for a teacher.
 * @param req
 * @param res
 */
exports.getInformationAboutTeacher = function (req, res) {
    app.pool.query(`SELECT * FROM public.teacher WHERE public.teacher.code = ${req.params.teachercode}`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        if (results) {
            res.json(results.rows);
        } else {
            res.send("gg");
        }
    });
};

/**
 * Get all alerts for a teacher.
 * @param req
 * @param res
 */
exports.getAlertsForATeacher = function (req, res) {
    app.pool.query(`SELECT a.*, b.first_name, b.last_name, b.image FROM alerts a join student b on a.teacher_id = ${req.params.teachercode} and a.type = 'Alert' and b.studentcode = a.student_id order by date desc`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Set alerts for a teacher.
 * @param req
 * @param res
 */
exports.setAlertForATeacher = function (req, res) {
    app.pool.query(`insert into alerts (id, teacher_id, student_id, info,type,grade) values(${req.body.alertid},${req.body.teachercode},${req.body.studentcode},'${req.body.info}','alert',false)`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        if (err) {
            res.json({status: false});
        } else {
            res.json({status: true});
        }
    });
};

/**
 * Authenticate a teacher.
 * @param req
 * @param res
 */
exports.authTeacher = function (req, res) {
    app.pool.query(`select email_address,password from public.teacher where public.teacher.email_address = '${req.body.username}' and public.teacher.password = '${req.body.pass}';`, (err, results) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept, token");
        if (err) {
            res.status(403);
            res.json("not ok");
        } else if (results.rowCount > 0) {
            generatedTokens[req.body.username]=jwt.sign(req.body.username, app2.get('jwt'));
            res.status(200);
            res.json({ token: generatedTokens[req.body.username]});
        } else {
            res.status(403);
            res.json("not ok");
        }
    });
};

/**
 * Retrieve a teacher's id based on a provided email.
 * @param req
 * @param res
 */
exports.getTeacherIdFromEmail = function (req, res) {
    app.pool.query(`SELECT * FROM public.teacher WHERE public.teacher.email_address = '${req.params.email}'`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get the schedule for a teacher along with the attendance for each lesson.
 * @param req
 * @param res
 */
exports.getSchedule = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, start_time, end_time, course."name", lesson.classes, "type", "date", lesson_id, course.id, count(student.studentcode) FROM public.lesson
                    right join student
                    on lesson.classes::text like concat('%',student.class,'%')
                    left join attendance
                    on attendance.student_id = student.studentcode
                    and lesson_id = attendance.lesson_code
                    inner join course
                    on lesson.course_code = course.id
                    where teacher_code = ${req.params.teachercode}
                    group by lesson_id, start_time, end_time, course.name, lesson.classes::text, "type", "date", course.id
                    order by lesson_id`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get all teachers from Saxion.
 * @param req
 * @param res
 */
exports.getAllTeachers = function (req, res) {
    app.pool.query(`select * from teacher`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Retrieve all classes for a teacher.
 * @param req
 * @param res
 */
exports.getClassesForTeacher = function (req, res) {
    app.pool.query(`select * from class
                    inner join classcourse
                    on class."name" = classcourse.class_name
                    inner join teachercourse
                    on teachercourse.course_id = classcourse.course_id
                    inner join course on
                    course.id = teachercourse.course_id
                    where teachercourse.teacher_code = ${req.params.teacherid}`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get the overall attendance for a teacher.
 * @param req
 * @param res
 * @constructor
 */
exports.AttendanceForATeacher = function (req, res) {
    app.pool.query(`SELECT * FROM public.attendance 
                    INNER JOIN public.lesson
                    ON public.lesson.lesson_id = public.attendance.lesson_code
                    AND public.lesson.teacher_code = ${req.params.teacherid}
                    inner join course
                    on course.id = lesson.course_code
                    ORDER BY week, public.lesson.date`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

exports.checkStudentAttendanceForAllTeachers = function (req, res) {
    app.pool.query(`select public.check_student_atendance()`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

exports.checkStudentGradesForAllTeachers = function (req, res) {
    app.pool.query(`select public.check_student_grades()`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get the attendance for all classes that a teacher is teaching.
 * @param req
 * @param res
 */
exports.getAttendanceForTeachersClasses = function (req, res) {
    app.pool.query(`select SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, student.class from attendance
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    and lesson.teacher_code = ${req.params.teacherid}
                    inner join student
                    on student.studentcode = attendance.student_id
                    group by student.class`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get the overall grades for a teacher.
 * @param req
 * @param res
 */
exports.getGradesForATeacher = function (req, res) {
    app.pool.query(`SELECT COUNT(student_id), result, type, class FROM public.grade
                    INNER JOIN public.test
                    ON public.test.test_number = public.grade.test_code
                    INNER JOIN public.course
                    ON public.course.id = public.test.course_id
                    INNER JOIN public.student
                    ON public.grade.student_id = public.student.studentcode
                    inner join teachercourse
                    on teachercourse.course_id = course.id
                    and teachercourse.teacher_code = ${req.params.teacherid}
                    GROUP BY public.grade.result, type, class
					ORDER BY result`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get the attendance data formatted in such a way that it can be displayed in a pie chart.
 * @param req
 * @param res
 */
exports.getPieChartAttendance = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse from attendance
                    inner join lesson 
                    on lesson.lesson_id = attendance.lesson_code
                    inner join course 
                    on course.id = lesson.course_code
                    and teacher_code = ${req.params.teacherid}
                    and course."year" = '2018'`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get the most and least visited courses for a teacher, along with the amount of students that were present, absent or
 * absent with excuse during these courses.
 * @param req
 * @param res
 */
exports.getMostVisitedAndLeastVisited = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, course."name"  from attendance
                    inner join lesson 
                    on lesson.lesson_id = attendance.lesson_code
                    inner join course 
                    on course.id = lesson.course_code
                    and teacher_code = ${req.params.teacherid}
                    and course."year" = '2018'
                    group by course."name"
                    order by present desc`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get attendance for all courses for a teacher.
 * @param req
 * @param res
 */
exports.getAttendanceForAllCourses = function (req, res) {
    let currentYear = moment(new Date()).format('YYYY');
    app.pool.query(`SELECT * FROM public.attendance 
                    INNER JOIN public.lesson
                    ON public.lesson.lesson_id = public.attendance.lesson_code
                    and lesson.teacher_code = ${req.params.teacherid}
                    inner join course
                    on lesson.course_code = course.id
                    and course."year" = '${currentYear}'
                    ORDER BY week, public.lesson.date`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Retrieve tha attendance for a selected course for a teacher.
 * @param req
 * @param res
 */
exports.getAttendanceForSelectedCourse = function (req, res) {
    app.pool.query(`SELECT * FROM public.attendance 
                    INNER JOIN public.lesson
                    ON public.lesson.lesson_id = public.attendance.lesson_code
                    and lesson.teacher_code = ${req.params.teacherid}
                    and course_code = ${req.params.courseid}
                    ORDER BY public.lesson.date`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get all of the courses that a teacher is teaching along with the attendnace and the average grade for them.
 * @param req
 * @param res
 */
exports.getTeacherCourses = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, course."name", course.ecc, course.year, course.quartile, course.id, avg(grade."result") from attendance
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    and lesson.teacher_code = ${req.params.teacherid}
                    inner join student
                    on student.studentcode = attendance.student_id
                    inner join course
                    on course.id = lesson.course_code
                    left join test
                    on test.course_id = lesson.course_code
                    left join grade
                    on test.test_number = grade.test_code
                    and grade.student_id = student.studentcode
                    group by course."name", course.ecc, course.year, course.quartile, course.id`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

exports.getAverageAttendance = function (req, res) {
    let allData = [{},{}];
    app.pool.query(`select SUM(case when status = 1 then 1 else 0 end) present,  COUNT(lesson_code) absent from attendance
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    and lesson.teacher_code = ${req.params.teacherid}
                    inner join student
                    on student.studentcode = attendance.student_id
                    inner join course
                    on course.id = lesson.course_code`, (err, results) => {
        allData[0] = results.rows;
        app.pool.query(`select SUM(case when status = 1 then 1 else 0 end) present,  COUNT(lesson_code) absent from attendance
                    inner join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    and not lesson.teacher_code = ${req.params.teacherid}
                    inner join student
                    on student.studentcode = attendance.student_id
                    inner join course
                    on course.id = lesson.course_code`, (err, results) => {
            res.status(200);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
            allData[1] = results.rows;
            res.json(allData);
        });
    });
};

/**
 * Get the average grades for a teacher.
 * @param req
 * @param res
 */
exports.getAverageGrades = function (req, res) {
    app.pool.query(`select avg("result"), student.class from grade
                    inner join test
                    on test.test_number = grade.test_code
                    inner join teachercourse
                    on teachercourse.course_id = test.course_id
                    inner join student
                    on grade.student_id = student.studentcode
                    and teachercourse.teacher_code = ${req.params.teacherid}
                    group by student.class`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get the grades for course. Number of grades per grade value.
 * @param req
 * @param res
 */
exports.getGradesForACourse = function (req, res) {
    app.pool.query(`SELECT COUNT(student_id), result, type, class FROM public.grade
                    INNER JOIN public.test
                    ON public.test.test_number = public.grade.test_code
                    INNER JOIN public.course
                    ON public.course.id = public.test.course_id
                    and course.id = ${req.params.courseid}
                    INNER JOIN public.student
                    ON public.grade.student_id = public.student.studentcode
                    inner join teachercourse
                    on teachercourse.course_id = course.id
                    and teachercourse.teacher_code = ${req.params.teacherid}
                    GROUP BY public.grade.result, type, class
					ORDER BY result`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get the grades per class that a teacher is teaching.
 * @param req
 * @param res
 */
exports.getGradesPerClass = function (req, res) {
    app.pool.query(`select avg(grade.result), class from teacher
                    inner join teachercourse
                    on teachercourse.teacher_code = teacher.code
                    and code = ${req.params.teacherid}
                    left join test
                    on test.course_id = teachercourse.course_id
                    left join grade
                    on test.test_number = grade.test_code
                    left join student
                    on student.studentcode = grade.student_id
                    group by student.class`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
        res.json(results.rows);
    });
};

/**
 * Get each class/course combination that the teacher is teaching, along with their attendance and grades.
 * @param req
 * @param res
 */
exports.getClassesForOnlyOneTeacher = function (req, res) {
    let classes = [];
    let classesInfo = [];
    let finalList = [];
    //Get all students from the lessons of a teacher.
    app.pool.query(`select "name", lesson.course_code, lesson.teacher_code from class
                    inner join lesson
                    on lesson.classes::text like concat('%',class."name",'%')
                    and lesson.teacher_code = ${req.params.teacherid}
                    group by name, lesson.course_code, lesson.teacher_code
                    `, (err, results) => {
        classes = results.rows;
        //Get each students attendance and grades ber class and per course.
        app.pool.query(`select class, lesson.teacher_code, avg(grade."result"),lesson.course_code, SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, course."name" from student
                    left join attendance
                    on attendance.student_id = student.studentcode
                    left join lesson
                    on attendance.lesson_code = lesson.lesson_id
                    left join course
                    on course.id = lesson.course_code
                    left join test
                    on test.course_id = lesson.course_code
                    left join grade
                    on test.test_number = grade.test_code
                    and grade.student_id = student.studentcode
                    group by class, course."name", course.id, lesson.teacher_code, lesson.course_code
                    `, (err, results) => {
            classesInfo = results.rows;
            //Combine the data from the two queries.
            for (let i = 0; i < classesInfo.length; i++) {
                for (let j = 0; j < classes.length; j++) {
                    if (classes[j].name === classesInfo[i].class && classes[j].course_code === classesInfo[i].course_code && classes[j].teacher_code === classesInfo[i].teacher_code){
                        finalList.push(classesInfo[i]);
                    }
                }
            }
            res.status(200);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, AcceptAccept");
            res.json(finalList);
        });
    });




};
