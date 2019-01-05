//File which contains the code that is required to read excel sheets and then upload them to the db.
const app = require('./app');

module.exports = {
    insertCourse: function (JSON, res, req) {
        //Method used for retrieving course data from a sheet and inserting it into the DB.
        try {
            console.log(JSON);
            //Create the initial part of the script.
            let insertScript = 'INSERT INTO public.course(' +
                ' name, ecc, id, year, quartile)' +
                ' VALUES';
            //Loop through the JSON and add the new items to the query.
            for (let i = 0; i < JSON.length; i++) {
                insertScript += ` ('${JSON[i].name}',  ${JSON[i].ecc}, ${JSON[i].id}, '${JSON[i].year}', '${JSON[i].quartile}')`;
                if (i < JSON.length - 1) {
                    insertScript += ',';
                }
            }
            insertScript += `;`;
            console.log(insertScript);
            //Execute the query.
            app.pool.query(insertScript, (err, results) => {
                res.status(200);
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                if (results !== undefined) {
                    //If all went fine return code 200.
                    res.status(200);
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    res.json(results.rows);
                } else {
                    //If there was an error return an error message.
                    res.status(500).send({error: "Bad excel file."});
                }
            });
        } catch (e) {
            //If there is something wrong with the file catch it and return an error message to the user.
            res.status(500).send({ error: "Bad excel file." });
        }
    },
    insertStudent: function (JSON, res, req) {
        //Method used to retrieve student data from a sheet and inserting it into the DB.
        try {
            console.log(JSON);
            //Create the initial part of the script.
            let insertScript = 'INSERT INTO public.student(' +
                ' studentcode, first_name, last_name, middle_name, sex, birthday, email_address, address, country, class, previous_study, syntaxis, introduction, transport, bison_link, phone_number, international, study)' +
                ' VALUES';
            //Loop through the JSON and add the new items to the query.
            //Some values are not loaded from the excel file, since they are missing from these files.
            for (let i = 0; i < 1; i++) {
                let birthday = JSON[i].Geboortedatum;
                let split = birthday.split('/');
                birthday = '' + split[1] + '-' + split[0] + '-' + split[2];
                insertScript += ` (${JSON[i].LoginID},  '${JSON[i].Achternaam}', '${JSON[i].Voornamen}', '${JSON[i].Roepnaam}', '${JSON[i].Geslacht}', '${birthday}'
            , '${JSON[i].Email}', '${JSON[i].Straat}', '${JSON[i].Land}', 'EHI1Sp', '${JSON[i].Degree}', true, true, 'Car', 'nobisonlink.com'
            , ${JSON[i].Mobiel}, true, '${JSON[i].Institute}')`;
                if (i === JSON.length - 1) {
                    insertScript += ',';
                }
            }
            insertScript += `;`;
            console.log(insertScript);
            //Execute the script.
            app.pool.query(insertScript, (err, results) => {
                res.status(200);
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                if (results !== undefined) {
                    //If the insert was successful then return code 200.
                    res.status(200);
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    res.json(results.rows);
                } else {
                    //If the file upload was undersell then return code 500 and an error message.
                    res.status(500).send({error: "Bad excel file."});
                }
            });
        } catch (e) {
            //If there is something wrong with the file catch it and return an error message to the user.
            res.status(500).send({ error: "Bad excel file." });
        }
    },
    insertEvaluation: function (JSON, res, req) {
        // console.log(JSON);
        //Method used for inserting data for evaluations from an excel sheet.
        try {
            //Create the initial script.
            let insertScript = 'INSERT INTO public.evaluation(' +
                ' eval_id, "course_Id", class_id, hours_spent, diffuculty, usefulness, teacher_id)' +
                ' VALUES';
            //Loop through the JSON and add the new items to the query.
            for (let i = 0; i < JSON.length; i++) {
                let hoursSpent = parseFloat(JSON[i].Bestedeuren);
                if (isNaN(hoursSpent)) {
                    hoursSpent = 0;
                }
                if ((!isNaN(parseInt(JSON[i].Nuttigleerzaam)) && !isNaN(parseInt(JSON[i].Moeilijkheidsgraad)))) {
                    insertScript += ` (${i + 99},  ${1}, '${JSON[i].Klas}', ${hoursSpent}, ${parseInt(JSON[i].Moeilijkheidsgraad)}, ${parseInt(JSON[i].Nuttigleerzaam)}
            , ${parseInt(JSON[i].Begeleider)})`;
                    if (i < JSON.length - 1) {
                        insertScript += ',';
                    }
                }
            }

            console.log(insertScript[insertScript.length - 1] === ',');
            //Format the query so it can be accepted by the DB.
            if (insertScript[insertScript.length - 1] === ',') {
                insertScript = insertScript.substr(0, insertScript.length - 1);
                insertScript += `;`;
                console.log(insertScript);
            } else {
                insertScript += `;`;
            }
            //Execute teh query.
            app.pool.query(insertScript, (err, results) => {
                if (results !== undefined) {
                    //If the query is successful then return code 200.
                    res.status(200);
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                    res.json(results.rows);
                } else {
                    //If the query is unsuccessful then return code 500 and an error message.
                    res.status(500).send({error: "Bad excel file."});
                }
            });
        } catch (e) {
            //If there is something wrong with the file catch it and return an error message to the user.
            res.status(500).send({ error: "Bad excel file." });
        }
    }

};


