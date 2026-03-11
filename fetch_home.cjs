const https = require('https');
const fs = require('fs');
const path = require('path');

https.get('https://giaphadaiviet.vn/', (res) => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
        fs.writeFileSync(path.join(__dirname, 'giaphadaiviet_home.html'), body);
        console.log('Saved giaphadaiviet_home.html');
    });
}).on('error', console.error);
