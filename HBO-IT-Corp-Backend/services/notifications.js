//File which contains the methods that are used for sending notifications and emails to the users when it is needed.

const app = require('../app');
const OneSignal = require('onesignal-node');
const moment = require('moment');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');

//Setup notifications:
//Setup the OneSignal service which is used to deliver web notifications via browsers.
//authKey and app data are on OneSignal's website in the users profile.
const myClient = new OneSignal.Client({
    userAuthKey: 'ZDJlOTFhZTQtMjFiNC00N2NjLTk4ZDgtZmI0ZmI5MzgyYTI4',
    // note that "app" must have "appAuthKey" and "appId" keys
    app: {appAuthKey: 'MzA5OWM5MDYtM2EwNi00Yzc4LWIwNjctYmRiNTcxNWY1YjFh', appId: '1945e5c6-0ed6-4716-94e8-5db0d08889bd'}
});

//Setup email:
//Setup the emailing module
const transporter = nodemailer.createTransport({
    secure: false,
    port: 5000,
    service: 'Yahoo',
    auth: {
        user: 'dashboard.api@yahoo.com',
        pass: 'TjghJgzaeJvyxNmbeNKetDVM'
    }
});

/**
 * Method which is used to send reminders to teacher, to remind them to input the attendance for the lesson that they
 * are teaching.
 */
function queUpAttendanceNotifications() {
    let allUsersOneSignal = [];
    let allLessonsForToday = [];
    let previousNotifications = [];

    //Get all notifications.
    myClient.viewNotifications(' ', function (err, httpResponse, data) {
        if (httpResponse.statusCode === 200 && !err) {
            //Parse the response to JSON so it can be worked with.
            let notifications = JSON.parse(data).notifications;
            //Get only the notifications from today.
            previousNotifications = notifications.filter(checkData);
            //Get all devices that are connected to OneSignal's dashboard app(user who have subscribed for notifications
            //from the dashboard website).
            myClient.viewDevices('limit=100&offset=0', function (err, httpResponse, data) {
                //Parse the data to JSON so it can be used.
                allUsersOneSignal = (JSON).parse(data).players;
                //Get all lessons for each teacher for the current day.
                app.pool.query(`select * from lesson
                        inner join course
                        on course_code = course.id
                        where "date" = '${moment().format('YYYY-MM-DD')}'`, (err, results) => {
                    //Store the results of the query.
                    allLessonsForToday = results.rows;
                    //Loop through all users.
                    for (let i = 0; i < allUsersOneSignal.length; i++) {
                        //Loop through all lessons.
                        for (let j = 0; j < allLessonsForToday.length; j++) {
                            //If a lesson for a user has been found the start setting up the notification.
                            if (String(allUsersOneSignal[i].tags.id) === String(allLessonsForToday[j].teacher_code)) {
                                //Create the notification object and put the necessary information in it( the text which
                                // is going to be displayed in the notification).
                                let attendanceNotification = new OneSignal.Notification({
                                    contents: {
                                        en: `Don't forget to fill in the attendance for the ${allLessonsForToday[j].name} ` +
                                        `${allLessonsForToday[j].type}, which starts from ${allLessonsForToday[j].start_time} ` +
                                        `and end at ${allLessonsForToday[j].end_time}`
                                    }
                                });
                                //Set the target device to the teacher, who is going to have this lesson. ( only one user
                                // will receive this notification).
                                attendanceNotification.setTargetDevices([`${allUsersOneSignal[i].id}`]);
                                //Set the time that the notification should be disabled to the user.
                                let fullDate = moment(`${moment().format('YYYY-MM-DD')} ${allLessonsForToday[j].start_time}`);
                                //Put the time in the notification.
                                attendanceNotification.setParameter('send_after', `${fullDate.format()}`);
                                //Put some headers into the notifications which are used later to check if a similar
                                //notification has already been created.
                                attendanceNotification.setParameter('headings', {
                                    "date": `${fullDate.format()}`,
                                    "id": `${allLessonsForToday[j].teacher_code}`
                                });

                                let unique = true;
                                //Check if the notification is unique.(has not been created already).
                                //Loop through all of the previous notifications for today.
                                for (let k = 0; k < previousNotifications.length; k++) {
                                    if (String(allLessonsForToday[j].teacher_code) === String(previousNotifications[k].headings.id)) {
                                        let setFor = moment.utc(previousNotifications[k].send_after * 1000).local();
                                        if (fullDate.format() === setFor.format()) {
                                            //If similar notification has been found then break the loop and don't send
                                            //a new notification.
                                            console.log('notification for ' + setFor.format() + ' at ' + allLessonsForToday[j].start_time + ' is already queued');
                                            unique = false;
                                            break;
                                        }
                                    }
                                }

                                //Send the notification if it is unique.
                                if (unique) {
                                    //Send the first notification.
                                    myClient.sendNotification(attendanceNotification, function (err, httpResponse, data) {
                                        if (err) {
                                            console.log('Something went wrong...');
                                        } else {
                                            console.log(data, httpResponse.statusCode);
                                        }
                                    });
                                    //Create a second notification for the same lesson.
                                    attendanceNotification = new OneSignal.Notification({
                                        contents: {
                                            en: `Sorry for interrupting your lesson, just a reminder.Don't forget to fill in the attendance for the ${allLessonsForToday[j].name} ` +
                                            `${allLessonsForToday[j].type}, which starts from ${allLessonsForToday[j].start_time} ` +
                                            `and end at ${allLessonsForToday[j].end_time}`
                                        }
                                    });
                                    //Get the end time for the lesson and format it so it can be used with moment.js.
                                    let fullDate = moment(`${moment().format('YYYY-MM-DD')} ${allLessonsForToday[j].end_time}`);
                                    //Subtract 20 minutes from this time.
                                    fullDate = fullDate.subtract(20, 'minutes');
                                    //Set the target device to the same teacher.
                                    attendanceNotification.setTargetDevices([`${allUsersOneSignal[i].id}`]);
                                    //Schedule the notification so it is send as a final reminder 20 minutes before the
                                    //end of the lesson.
                                    attendanceNotification.setParameter('send_after', `${fullDate.format()}`);
                                    //Send some heading.
                                    attendanceNotification.setParameter('headings', {
                                        "date": `${fullDate.format()}`,
                                        "id": `${allLessonsForToday[j].teacher_code}`
                                    });
                                    //Send the second notification.
                                    myClient.sendNotification(attendanceNotification, function (err, httpResponse, data) {
                                        if (err) {
                                            console.log('Something went wrong...');
                                        } else {
                                            console.log(data, httpResponse.statusCode);
                                        }
                                    });
                                }
                            }
                        }
                    }
                });

            });
        }
    });
}

/**
 * Method which is used to schedule alerts and to send emails regarding a student's attendance.
 */
function queueUpAttendanceAlerts() {
    let allUsersOneSignal = [];
    let allLessonsForToday = [];
    let previousNotifications = [];

    //Get all notifications.
    myClient.viewNotifications(' ', function (err, httpResponse, data) {
        if (httpResponse.statusCode === 200 && !err) {
            let notifications = JSON.parse(data).notifications;
            //Sort the list and leave only notifications which were made today.
            previousNotifications = notifications.filter(checkData);
            //Retrieve all devices which are connected to the OneSignal Service.
            myClient.viewDevices('limit=100&offset=0', function (err, httpResponse, data) {
                allUsersOneSignal = (JSON).parse(data).players;
                let currentDate = moment().format('YYYY-MM-DD');
                //Get all alerts for the current day for each teacher.
                app.pool.query(`select * from alerts
                                inner join teacher
                                on teacher.code = alerts.teacher_id
                                where not "type" = 'reminder'
                                and date = '${currentDate} 00:00:00'`, (err, results) => {
                    //Store the result.
                    allLessonsForToday = results.rows;
                    //Loop through all users.
                    for (let i = 0; i < allUsersOneSignal.length; i++) {
                        //Loop through all lessons.
                        for (let j = 0; j < allLessonsForToday.length; j++) {
                            let teacherEmail = '';
                            //If the user's id matches the id of the alert then start creating the notification.
                            if (String(allUsersOneSignal[i].tags.id) === String(allLessonsForToday[j].teacher_id)) {
                                teacherEmail = allLessonsForToday[j].email_address;
                                //Create the OneSignal notification and put the alert information in it.
                                let attendanceNotification = new OneSignal.Notification({
                                    contents: {
                                        en: `${allLessonsForToday[j].info}`
                                    }
                                });
                                ///Set the target device, so only this user can receive it.
                                attendanceNotification.setTargetDevices([`${allUsersOneSignal[i].id}`]);
                                //Get a data object for the same day at 4:30.
                                let fullDate = moment(`${moment().format('YYYY-MM-DD')} 16:30:00`);
                                //Schedule the notification so it is received by the user after 4:30.
                                attendanceNotification.setParameter('send_after', `${fullDate.format()}`);
                                //Set some headings.
                                //These headings are used to check if such a notification has already been created.
                                attendanceNotification.setParameter('headings', {
                                    "date": `${fullDate.format()}`,
                                    "id": `${allLessonsForToday[j].teacher_id}`,
                                    "info": `${allLessonsForToday[j].info}`
                                });

                                let unique = true;
                                //Go through all of the previously created notifications for today and check if there is
                                //a notification which is the same as the one that is going to be sent.
                                for (let k = 0; k < previousNotifications.length; k++) {
                                    if (String(allLessonsForToday[j].teacher_id) === String(previousNotifications[k].headings.id)) {
                                        let setFor = moment.utc(previousNotifications[k].send_after * 1000).local();
                                        if (fullDate.format() === setFor.format() && previousNotifications[k].headings.info.toString() === allLessonsForToday[j].info) {
                                            //If a similar notification is found then output it to the console and break
                                            //the loop.
                                            console.log('notification for ' + setFor.format() + ' with text ' + allLessonsForToday[j].info + ' is already queued');
                                            unique = false;
                                            break;
                                        }
                                    }
                                }

                                //If the alert is unique then proceed to seining it.
                                if (unique) {
                                    //Setup the mail options.
                                    let mailOptions = {
                                        from: 'dashboard.api@yahoo.com',
                                        to: `${teacherEmail}`,
                                        subject: `Attendance alert!`,
                                        text: `${allLessonsForToday[j].info}`
                                    };
                                    //Finally send the notification.
                                    myClient.sendNotification(attendanceNotification, function (err, httpResponse, data) {
                                        if (err) {
                                            console.log('Something went wrong...');
                                        } else {
                                            console.log(data, httpResponse.statusCode);
                                        }
                                    });
                                    //Finally send the eamil.
                                    transporter.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log('Email sent: ' + info.response);
                                        }
                                    });
                                }
                            }
                        }
                    }
                });

            });
        }
    });
}

//Execute the methods once when the server starts.
queUpAttendanceNotifications();
scheduleTasks();
first(function () {
    second();
});

/**
 * Method which is used to reschedule the execution of notification methods for the next morning.
 */
function scheduleTasks() {
    //Get the current date.
    let a = moment(new Date()).format('YYYY-MM-DD');
    //Change the hour.
    a = moment(new Date(`${a} 01:00:00`));
    //Add one day to the date.
    a = moment(a).add(1, 'days');
    //Format it again so it can be used in the method.
    a = moment(a).format('YYYY-MM-DD HH:mm:ss');
    console.log(a);
    //Schedule the execution for the next day at 1 am.
    var j = schedule.scheduleJob(new Date(a), function () {
        queUpAttendanceNotifications();
        first(function () {
            second();
        });
        scheduleTasks();
    });
}

//Setup tasks:

function first(callback) {
    checkForAttendanceAlerts();
    callback();
}

function second() {
    queueUpAttendanceAlerts();
}


//Helper methods:

/**
 * Helped method which is used to sort a list based on date.
 * @param object
 * @returns {boolean}
 */
function checkData(object) {
    let queuedAt = moment.utc(object.queued_at * 1000).local();
    let setFor = moment.utc(object.send_after * 1000).local();
    queuedAt = queuedAt.format('YYYY-MM-DD');
    setFor = setFor.format('YYYY-MM-DD h:mm:ss');
    return queuedAt === (moment().format('YYYY-MM-DD')) && setFor > (moment().format('YYYY-MM-DD h:mm:ss'));
}

/**
 * Method which is used to query the DB and to see if there are any alarming students.
 */
function checkForAttendanceAlerts() {
    let attendancePercentage = 0;
    let text = 0;
    let alertsSize = 0;


    myClient.viewNotifications(' ', function (err, httpResponse, data) {
        //Get all alerts from the DB.
        app.pool.query(`select * from alerts`, (err, results) => {
            //Save the alertsSize so it can be used for creating unique primary keys.
            alertsSize = results.rows.length;

            /**
             * Helper method which is used to check if an alert for a student has already been created.
             * @param item The new alert.
             * @returns {boolean} Returns whether such an alert already exists.
             */
            function checkIfExists(item) {
                let unique = true;
                //Loop through all alerts and check.
                for (let i = 0; i < results.rows.length; i++) {
                    if (item.studentcode === results.rows[i].student_id) {
                        unique = false;
                        break;
                    }
                }
                return unique;
            }

            //Get how many times each student has been present absent and absent with excuse.
            app.pool.query(`select SUM(case when status = 1 then 1 else 0 end) present,  SUM(case when status = 3 then 1 else 0 end) absent, SUM(case when status = 2 then 1 else 0 end) excuse, first_name, last_name, teacherstudent.teacher_code, studentcode from student
                        inner join attendance
                        on attendance.student_id = studentcode
                        left join teacherstudent
                        on teacherstudent.student_code = studentcode
                        group by studentcode, teacherstudent.teacher_code`, (err, results) => {
                for (let i = 0; i < results.rows.length; i++) {
                    //Calculate the attendance percentage.
                    attendancePercentage = (parseFloat(results.rows[i].present) * 100) / (parseFloat(results.rows[i].present) + parseFloat(results.rows[i].absent) + parseFloat(results.rows[i].excuse));
                    //If the percentage is less than 60% than an alert should be created.
                    //Depending on the exact percentage, a different text will be included for each alert.
                    if (attendancePercentage <= 60) {
                        if (attendancePercentage <= 60 && attendancePercentage > 50) {
                            text = `${results.rows[i].first_name} ${results.rows[i].last_name} attendance percentage has dropped between 60% and 50%. Current attendance: ${attendancePercentage.toFixed(1)}`;
                        } else if (attendancePercentage <= 50 && attendancePercentage > 40) {
                            text = `${results.rows[i].first_name} ${results.rows[i].last_name} attendance percentage has dropped between 50% and 40%. Current attendance: ${attendancePercentage.toFixed(1)}`;
                        } else if (attendancePercentage <= 40 && attendancePercentage > 30) {
                            text = `${results.rows[i].first_name} ${results.rows[i].last_name} attendance percentage has dropped between 40% and 30%. Current attendance: ${attendancePercentage.toFixed(1)}`;
                        } else if (attendancePercentage <= 30 && attendancePercentage > 20) {
                            text = `${results.rows[i].first_name} ${results.rows[i].last_name} attendance percentage has dropped between 30% and 20%. Current attendance: ${attendancePercentage.toFixed(1)}`;
                        } else if (attendancePercentage <= 20 && attendancePercentage > 10) {
                            text = `${results.rows[i].first_name} ${results.rows[i].last_name} attendance percentage has dropped between 20% and 10%. Current attendance: ${attendancePercentage.toFixed(1)}`;
                        } else if (attendancePercentage <= 10) {
                            text = `${results.rows[i].first_name} ${results.rows[i].last_name} attendance percentage has dropped below 10%. Current attendance: ${attendancePercentage.toFixed(1)}`;
                        }

                        //Check if the student has a registered study coach.
                        if (results.rows[i].teachercode !== null) {
                            //Check an alert for this student already exists.
                            if (checkIfExists(results.rows[i])) {
                                //If everything is OK then create a new row in the alerts table and put the information
                                //in it.
                                app.pool.query(`INSERT INTO public.alerts
                                                (id, teacher_id, info, "date", "type", student_id, grade)
                                                VALUES(${alertsSize + i}, ${results.rows[i].teacher_code}, '"${text}"', '${moment(new Date()).format('YYYY-MM-DD')}', 'Alert', ${results.rows[i].studentcode}, false);`, (err, results) => {
                                    console.log(err)
                                });
                            }
                        }
                    }
                }
            });
        });

    });
}
