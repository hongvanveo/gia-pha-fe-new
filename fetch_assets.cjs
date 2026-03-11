const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                resolve(`Failed ${url}: ${response.statusCode}`);
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function main() {
    const publicDir = path.join(__dirname, 'public');
    await download('https://cp.giaphadaiviet.vn/dang-nhap', path.join(publicDir, 'ref-login.html'));
    await download('https://cp.giaphadaiviet.vn/images/login-bg.jpg', path.join(publicDir, 'paper-bg-new.jpg'));
    await download('https://giaphadaiviet.vn/wp-content/themes/giapha/img/dragon.png', path.join(publicDir, 'dragon-new.png'));
    await download('https://giaphadaiviet.vn/wp-content/themes/giapha/img/pattern.png', path.join(publicDir, 'trong-dong-new.png'));
    console.log('done');
}
main();
