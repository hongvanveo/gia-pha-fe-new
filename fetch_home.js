const https = require('https');
const fs = require('fs');

https.get('https://giaphadaiviet.vn/', (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        fs.writeFileSync('giaphadaiviet_home.html', body);
        console.log('Saved giaphadaiviet_home.html');
    });
}).on('error', console.error);
