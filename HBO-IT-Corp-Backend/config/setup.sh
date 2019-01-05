#!/bin/sh
# split project and system files
# in retrospective: what are you gonna improve on the next sprint
# document more hours.

# meet with client next week friday or thursday
# problem solved

# appointment for week 8 with hesther.


#VPS setup instructions:
echo "installing required programs"
sudo apt-get update
sudo apt-get install git -y
sudo apt-get install npm -y
sudo apt-get install postgresql -y
sudo apt-get install nginx -y
sudo npm install forever -g

sudo -u postgres psql dummyDB < 'file_path'

echo "setting up nginx"
sudo echo 
"server {

    listen         80;
    listen         [::]:80;
    listen         5000;
    listen         [::]:5000;
    root           /home/admin/2017-2018-Project-HBO-IT-Corp-6-Frontend/dashboard/dist;
    index          index.html;
    try_files $uri /index.html;


location /api {
alias /home/admin/2017-2018-Project-HBO-IT-Corp-6-Backend/bin/www;
#add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Headers' '*';
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        
        proxy_set_header X-Forwarder-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://localhost:3000;
        proxy_redirect off;
}
        
}" > /etc/nginx/sites-available/default

sudo nginx -t

echo "cloning repos"
cd
git clone 2017-2018-Project-HBO-IT-Corp-6-Backend
git clone 2017-2018-Project-HBO-IT-Corp-6-Frontend
cd 2017-2018-Project-HBO-IT-Corp-6-Backend

echo "installing backend"
npm install
echo "starting backend"
sudo forever start app.js

echo "installing frontend"
cd ../2017-2018-Project-HBO-IT-Corp-6-Frontend/dashboard
npm install
echo "building frontend, this might take up to 20 minutes"
npm run build

echo "Restarting nginx"
sudo service nginx restart
echo "setup complete"