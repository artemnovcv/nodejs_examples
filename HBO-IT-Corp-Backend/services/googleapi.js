//File which holds the methods that are used to acquire a students geographical information.

const app = require('../app');
const axios = require('axios');

/**
 * Method used to create rows for each student in the geolocation table. And to also fill these rows with information
 * which is retrieved from 2 Google API's.
 */
function createRows() {
    //Get all of the students along with their geolocation rows.
    app.pool.query(`select * from student
                left join geolocation
                on studentcode = geolocation.student_id`, (err, results) => {
        //Loop through the received data.
        for (let i = 0; i < results.rows.length; i++) {
            //If a student has an empty geolocation row then fill it.
            if (results.rows[i].student_id === null){
                //First the Geocode API is used to retrieve the lang ang lat for a student based on their address. This
                //information is needed for Google Maps to display the address with a marker.
                axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${results.rows[i].address}&key=AIzaSyD4BT1DM8XNvfqUFJdKcd5miPA9Ec-8ViU`)
                    .then(function (response) {
                        let langLat = response.data.results[0].geometry.location;
                        //Second the Distance Matrix API is used to retrieve the distance from the student's address
                        //to Saxion University Enschede. We also use it to retrieve the time that it takes for a student
                        //to travel that distance by bike.
                        //Note: A query can only have on mode of transportation.
                        axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${results.rows[i].address},NL&destinations=Saxion,%20Enschede,%20NL&mode=bicycling&key=AIzaSyD4BT1DM8XNvfqUFJdKcd5miPA9Ec-8ViU`)
                            .then(function (response) {
                                //Finally insert the newly gathered data into the DB.
                                app.pool.query(`INSERT INTO public.geolocation
                                                (student_id, traveldistance, schooldistance, mapcoordinates)
                                                VALUES(${results.rows[i].studentcode}, '${response.data.rows[0].elements[0].duration.text}', '${response.data.rows[0].elements[0].distance.text}', '[${JSON.stringify(langLat)}]');
                                                `, (err, results) => {
                                    console.log(err);
                                });
                            })
                            .catch(function (error) {
                                // console.log(error);
                            });
                    })
                    .catch(function (error) {
                        // console.log(error);
                    });
            }
        }
    });
}

//Triggered when the server is started.
createRows(function () {

});
