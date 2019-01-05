//File which contains all of the routes that are used in the program.

const studentRoutes = require('./routes/student.js');
const teacherRoutes = require('./routes/teacher.js');
const courseRoutes = require('./routes/course.js');
const classRoutes = require('./routes/class.js');
const reminderRoutes = require('./routes/reminders.js');
const evaluationRoutes = require('./routes/evaluation.js');
const attendanceRoutes = require('./routes/attendance.js');
// const uploadRoutes = require('./routes/upload.js');


var express = require('express');
var router = express.Router();


router.post('/auth', teacherRoutes.authTeacher);
router.get('/courses/all', teacherRoutes.verifyToken, courseRoutes.getAllCourses);

//STUDENT ROUTES:
router.get('/student/:studentcode/information', teacherRoutes.verifyToken, studentRoutes.getInformationAboutStudent);
router.get('/student/:studentcode/courses', teacherRoutes.verifyToken, studentRoutes.getCoursesForStudent);
router.get('/student/:studentcode/attendhours/most', teacherRoutes.verifyToken, studentRoutes.getMostAttendedHours);
router.get('/student/:studentcode/attendhours/least', teacherRoutes.verifyToken, studentRoutes.getLeastAttendedHours);
router.get('/student/:address/get/driving', teacherRoutes.verifyToken, studentRoutes.getDriving);
router.get('/student/:address/get/busing', teacherRoutes.verifyToken, studentRoutes.getBusing);
router.get('/student/:address/get/walking', teacherRoutes.verifyToken, studentRoutes.getWalking);

//COURSE ROUTES:
router.get('/course/:courseid/allclasses', teacherRoutes.verifyToken, courseRoutes.getAllClassesForCourse);
router.get('/course/:courseid/allteachers', teacherRoutes.verifyToken, courseRoutes.getAllTeachersForACourse);
router.get('/course/:courseid/allgrades', teacherRoutes.verifyToken, courseRoutes.getGradesForACourse);
router.get('/course/:courseid/allattendance', teacherRoutes.verifyToken, courseRoutes.getAllAttendanceForACourse);
router.get('/course/:courseid/:studentid/attendancestudent', teacherRoutes.verifyToken, courseRoutes.getAttendanceForASelectedCourse);
router.get('/course/:studentid/attendancestudent', teacherRoutes.verifyToken, courseRoutes.getAttendanceForAllCoursesForStudent);
router.get('/course/:courseid/getschedule', teacherRoutes.verifyToken, courseRoutes.getScheduleForASelectedCourse);
router.get('/course/:courseid/getlessons', teacherRoutes.verifyToken, courseRoutes.getLessonsForACourse);
router.get('/course/:courseid/getattendancedistance', teacherRoutes.verifyToken, courseRoutes.getAttendanceBasedOnDistance);
router.get('/course/:courseid/getattendancedistanceperhour', teacherRoutes.verifyToken, courseRoutes.getAttendanceBasedOnDistancePerHour);
router.get('/course/:lessonid/getlessonsstudent', teacherRoutes.verifyToken, courseRoutes.getStudentsForALesson);

//TEACHER ROUTES:
router.get('/teacher/:teachercode/schedule', teacherRoutes.verifyToken, teacherRoutes.getSchedule);
router.get('/teacher/:teachercode/alerts', teacherRoutes.verifyToken, teacherRoutes.getAlertsForATeacher);
router.post('/teacher/setalert', teacherRoutes.verifyToken, teacherRoutes.setAlertForATeacher);
router.get('/teacher/:teachercode/information', teacherRoutes.verifyToken, teacherRoutes.getInformationAboutTeacher);
router.get('/teacher/:email', teacherRoutes.verifyToken, teacherRoutes.getTeacherIdFromEmail);
router.get('/teacher/get/allteachers', teacherRoutes.verifyToken, teacherRoutes.getAllTeachers);
router.get('/teacher/:teacherid/allclasses', teacherRoutes.verifyToken, teacherRoutes.getClassesForTeacher);
router.get('/teacher/:teacherid/attendance', teacherRoutes.verifyToken, teacherRoutes.AttendanceForATeacher);
router.get('/teacher/:teacherid/allgrades', teacherRoutes.verifyToken, teacherRoutes.getGradesForATeacher);
router.get('/teacher/:teacherid/classattendance', teacherRoutes.verifyToken, teacherRoutes.getAttendanceForTeachersClasses);
router.get('/teacher/checkstudentattendance', teacherRoutes.verifyToken, teacherRoutes.checkStudentAttendanceForAllTeachers);
router.get('/teacher/checkstudentgrades', teacherRoutes.verifyToken, teacherRoutes.checkStudentGradesForAllTeachers);
router.get('/teacher/:teacherid/piechart', teacherRoutes.verifyToken, teacherRoutes.getPieChartAttendance);
router.get('/teacher/:teacherid/barChartMaxLeast', teacherRoutes.verifyToken, teacherRoutes.getMostVisitedAndLeastVisited);
router.get('/teacher/:teacherid/allcoursesattendance', teacherRoutes.verifyToken, teacherRoutes.getAttendanceForAllCourses);
router.get('/teacher/:teacherid/allcourses', teacherRoutes.verifyToken, teacherRoutes.getTeacherCourses);
router.get('/teacher/:teacherid/:courseid/selectedcourse', teacherRoutes.verifyToken, teacherRoutes.getAttendanceForSelectedCourse);
router.get('/teacher/:teacherid/averageattendance', teacherRoutes.verifyToken, teacherRoutes.getAverageAttendance);
router.get('/teacher/:teacherid/averagegrades', teacherRoutes.verifyToken, teacherRoutes.getAverageGrades);
router.get('/teacher/:teacherid/:courseid/gradescourse', teacherRoutes.verifyToken, teacherRoutes.getGradesForACourse);
router.get('/teacher/:teacherid/gradesclass', teacherRoutes.verifyToken, teacherRoutes.getGradesPerClass);
router.get('/teacher/:teacherid/adminpageclasses', teacherRoutes.verifyToken, teacherRoutes.getClassesForOnlyOneTeacher);


//CLASS ROUTES:
router.get('/class/:name/schedule', teacherRoutes.verifyToken, classRoutes.getSchedule);
router.get('/class/:classname/courses', teacherRoutes.verifyToken, classRoutes.getCoursesForAClass);
router.get('/class/:classname/:course/grades', teacherRoutes.verifyToken, classRoutes.getGradesForACourse);
router.get('/class/:classname/attperstudent', teacherRoutes.verifyToken, classRoutes.getAllAttendanceForAClass);
router.get('/class/all', teacherRoutes.verifyToken, classRoutes.getAllStudentSortedByClass);
router.get('/class/:classname/allstudents', teacherRoutes.verifyToken, classRoutes.getStudentsForAClass);
router.get('/class/:classname/attendancedistance', teacherRoutes.verifyToken, classRoutes.getAttendanceDistanceForClass);
router.get('/class/:classname/:courseid/courseattendance', teacherRoutes.verifyToken, classRoutes.getClassAttendanceForACourse);
router.get('/class/:classname/:courseid/coursedistance', teacherRoutes.verifyToken, classRoutes.getAttendanceDistanceForClassForCourse);
router.get('/class/every/class', teacherRoutes.verifyToken, classRoutes.getAllClasses);
router.get('/class/:classname/:coursecode/getstudentswithinfo', teacherRoutes.verifyToken, classRoutes.getStudentsForAClassWithInfo);


//UPLOAD FILE ROUTES:
// router.post('/upload', uploadRoutes.uploadFile);
router.get('/reminder/:teacherid/:time/get', teacherRoutes.verifyToken, reminderRoutes.getAttendanceReminders);

//ATTENDANCE ROUTES:
router.post('/attendance/post', attendanceRoutes.submitAttendance);


//REMINDER ROUTES:

//Evaluation ROUTES:
router.get('/evaluation/years', teacherRoutes.verifyToken, evaluationRoutes.getAllYears);
router.get('/evaluation/courses', teacherRoutes.verifyToken, evaluationRoutes.getAllCourses);
router.get('/evaluation/:courseid/averages', teacherRoutes.verifyToken, evaluationRoutes.getAverages);
router.get('/evaluation/:courseid/allaverages', teacherRoutes.verifyToken, evaluationRoutes.getAllAverages);
router.get('/evaluation/:courseid/classaverages', teacherRoutes.verifyToken, evaluationRoutes.getAveragesByClass);
router.get('/evaluation/:courseid/fillpercentage', teacherRoutes.verifyToken, evaluationRoutes.getPercentage);


module.exports = router;
