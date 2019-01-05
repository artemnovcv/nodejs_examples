//Fine containing the routes for uploading files as well as updating a student's information.


const express = require('express');
const router = express.Router();
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const xlsxj = require("xlsx-to-json-lc");
const app = require('./app');

const insertSQL = require('./insertSQL');

router.post('/upload/:type', function(req, res){

    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/uploads');

    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function(field, file) {
        fs.rename(file.path, path.join(form.uploadDir, file.name));
        //Depending on the file type different code is executed.
        if (req.params.type === 'Course sheet'){
            //Parse sheet to JSON.
            xlsxj({
                input: `uploads/${file.path.replace(/^.*[\\\/]/, '')}`,
                output: "output.json",
            }, function(err, result) {
                if(err) {
                    console.error(err);
                }else {
                    insertSQL.insertCourse(result, res, req);
                }
            });
        } else if (req.params.type === 'Student sheet') {
            //Parse sheet to JSON.
            xlsxj({
                input: `uploads/${file.path.replace(/^.*[\\\/]/, '')}`,
                output: "output.json",
            }, function(err, result) {
                if(err) {
                    console.error(err);
                }else {
                    insertSQL.insertStudent(result, res, req);
                }
            });
        } else if (req.params.type === 'Evaluation sheet') {
            //Parse sheet to JSON.
            //Here a sheet: value is added since Evaluation sheets have more than one tab.
            xlsxj({
                input: `uploads/${file.path.replace(/^.*[\\\/]/, '')}`,
                output: "output.json",
                sheet: "Evaluatieformulieren"
            }, function(err, result) {
                if(err) {
                    console.error(err);
                }else {
                    insertSQL.insertEvaluation(result, res, req);
                }
            });
        }

    });

    // log any errors that occur
    form.on('error', function(err) {
        console.log('An error has occured: \n' + err);
    });

    // // once all the files have been uploaded, send a response to the client
    // form.on('end', function() {
    //     res.end('success');
    // });

    // parse the incoming request containing the form data
    form.parse(req);
});

/**
 * Route used to update a student's personal information.
 */
router.post('/upload/student/studentinfo', function(req, res){
        app.pool.query(`UPDATE public.student
                    SET first_name='${req.body.json.first_name}', last_name='${req.body.json.last_name}', middle_name='${req.body.json.middle_name}', address='${req.body.json.address}', country='${req.body.json.country}', class='${req.body.json.group}', previous_study='${req.body.json.previous_study}', syntaxis=${req.body.json.syntaxis}, introduction=${req.body.json.introduction}, transport='${req.body.json.transport}', birthday='${req.body.json.birthday}'
                    WHERE studentcode=${req.body.json.studycode};
`
            , (err, results) => {
            if (results !== null && results !== undefined){
                res.status(200);
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                res.send('success');
            } else {
                res.status(404);
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                res.send('fail');
            }
            });
});

module.exports = router;
