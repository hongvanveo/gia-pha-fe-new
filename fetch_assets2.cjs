const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'https://giaphadaiviet.vn/' } }, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
            } else {
                console.error(`Failed ${url}: ${res.statusCode}`);
                resolve();
            }
        }).on('error', reject);
    });
}

async function main() {
    const publicDir = path.join(__dirname, 'public');
    await download('https://giaphadaiviet.vn/wp-content/themes/giapha/img/dragon.png', path.join(publicDir, 'dragon-real.png'));
    await download('https://giaphadaiviet.vn/wp-content/themes/giapha/img/pattern.png', path.join(publicDir, 'trong-dong-real.png'));
    await download('https://giaphadaiviet.vn/wp-content/uploads/2021/05/bg-web.jpg', path.join(publicDir, 'bg-web-real.jpg'));
    console.log('done downloading assets');
}

main().catch(console.error);
