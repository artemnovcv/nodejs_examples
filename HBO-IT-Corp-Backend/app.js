const express = require('express');
const upload = require('./upload.js');
const router = require('./router.js');
const notifications = require('./services/notifications.js');
const bodyParser = require('body-parser');
const OneSignal = require('onesignal-node');
const schedule = require('node-schedule');


const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const cors = require('cors');
const xlsxj = require("xlsx-to-json-lc");
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
    extended: true
}));
//const router = require('./router.js');
//Establish connection with the DB.
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'dummyDB',
    password: '1234',
    port: 5432,
});

exports.pool = pool;
const googleapi = require('./services/googleapi.js');

app.use('/api', router);
app.use('/api', upload);

app.listen(5000, function () {
    console.log('Dev app listening on port 5000!');
});


module.exports = app;
