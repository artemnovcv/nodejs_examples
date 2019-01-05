//File which contains the routes that used in the student page.

const app = require('../app');
const axios = require('axios');
/**
 * Get all of the information about a certain student.
 * @param req
 * @param res
 */
exports.getInformationAboutStudent = function (req, res) {
    app.pool.query(`SELECT * FROM public.student 
                    left join geolocation
                    on studentcode = geolocation.student_id WHERE public.student.studentcode = ${req.params.studentcode}`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get all courses that a student is or has attended along with the attendance and the grade that the student has
 * received.
 * @param req
 * @param res
 */
exports.getCoursesForStudent = function (req, res) {
  app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, lesson.course_code, grade."result", course.ecc, course.quartile, course.year, course."name" from attendance
                        inner join lesson
                        on lesson_code = lesson.lesson_id
                        left join course
                        on lesson.course_code = course.id
                        left join test
                        on test.course_id = lesson.course_code
                        left join grade
                        on grade.test_code = test.test_number
                        and grade.student_id = ${req.params.studentcode}
                        where attendance.student_id = ${req.params.studentcode}
                        group by lesson.course_code, grade."result", course.ecc, course.quartile, course.year, course."name"`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the attendance for a selected course.
 * @param req
 * @param res
 */
exports.getAttendanceForASelectedCourse = function (req, res) {
    app.pool.query(`SELECT * FROM public.attendance 
                    WHERE public.attendance.course_code = ${req.params.courseid}
                    AND public.attendance.student_id = ${req.params.studentid}
                    ORDER BY date`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Get the most attended hour for a student and the amount of times that the student was present, absent and absent with
 * excuse during that hours.
 * @param req
 * @param res
 */
exports.getMostAttendedHours = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, start_time as time
                    FROM attendance
					INNER JOIN lesson
					ON attendance.lesson_code = lesson.lesson_id
                    WHERE student_id = ${req.params.studentcode}
                    group by start_time
                    order by present desc`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        if (results)  {
            res.json(results.rows);
        } else {
            res.send("gg");
        }
    });
};

/**
 * Get the least attended hour for a student and the amount of times that the student was present, absent and absent with
 * excuse during that hours.
 * @param req
 * @param res
 */
exports.getLeastAttendedHours = function (req, res) {
    app.pool.query(`SELECT SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, start_time as time
                    FROM attendance
					INNER JOIN lesson
					ON attendance.lesson_code = lesson.lesson_id
                    WHERE student_id = ${req.params.studentcode}
                    group by start_time
                    order by present asc`, (err, results) => {
        res.status(200);
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.json(results.rows);
    });
};

/**
 * Query the Distance Matrix API to receive the travel time that a student needs to reach Saxion by walking.
 * @param req
 * @param res
 */
exports.getWalking = function (req, res) {
    axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${req.params.address},NL&destinations=Saxion,%20Enschede,%20NL&mode=walking&key=AIzaSyD4BT1DM8XNvfqUFJdKcd5miPA9Ec-8ViU`)
        .then(function (response) {
            res.status(200);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.json(response.data.rows[0].elements[0].duration.text);
        })
        .catch(function (error) {
            // console.log(error);
        });
};

/**
 * Query the Distance Matrix API to receive the travel time that a student needs to reach Saxion by taking the bus.
 * @param req
 * @param res
 */
exports.getBusing = function (req, res) {
    axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${req.params.address},NL&destinations=Saxion,%20Enschede,%20NL&mode=transit&transit_mode=bus&key=AIzaSyD4BT1DM8XNvfqUFJdKcd5miPA9Ec-8ViU`)
        .then(function (response) {
            res.status(200);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.json(response.data.rows[0].elements[0].duration.text);
        })
        .catch(function (error) {
            // console.log(error);
        });
};

/**
 * Query the Distance Matrix API to receive the travel time that a student needs to reach Saxion by driving.
 * @param req
 * @param res
 */
exports.getDriving = function (req, res) {
    axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${req.params.address},NL&destinations=Saxion,%20Enschede,%20NL&mode=driving&key=AIzaSyD4BT1DM8XNvfqUFJdKcd5miPA9Ec-8ViU`)
        .then(function (response) {
            res.status(200);
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            res.json(response.data.rows[0].elements[0].duration.text);
        })
        .catch(function (error) {
            // console.log(error);
        });
};

//Note: Distance Matrix API can only include one mode of transportation.
