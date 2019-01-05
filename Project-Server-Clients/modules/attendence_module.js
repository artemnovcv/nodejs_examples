//init required modules
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

// forces to read body 
router.use(bodyParser.json());

//api calls
/**
 * FUNCTION: Get the attendance of a course per week (input: course code)
 */
router.get('/:course', function (req, res) {
    var course = req.params.course;
    db.query("SELECT week,status,count(status) AS count_attendance FROM attendance a INNER JOIN scheduled s ON a.scheduled=s.course AND s.course='"+course+"' GROUP BY a.week, a.status",function (err, result, fields) {
        if (err){
            res.status(404);
            res.json({message: "Cannot get attendance list"});
        }
        console.log(result);
        res.status(200);
        res.json(result);
    })
});


// exports the functions to index.js
module.exports = router;