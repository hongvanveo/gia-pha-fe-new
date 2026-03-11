const https = require('https');
const fs = require('fs');
const path = require('path');

function download(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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
    await download('https://giaphadaiviet.vn/wp-content/themes/giapha/assets/images/home-banner-bg-1.png', path.join(publicDir, 'home-banner-bg-1.png'));
    await download('https://giaphadaiviet.vn/wp-content/themes/giapha/assets/images/banner-intro-1.png', path.join(publicDir, 'banner-mockup.png'));
    await download('https://giaphadaiviet.vn/wp-content/themes/giapha/assets/images/bg-image-2.png', path.join(publicDir, 'bg-image-2.png'));
    console.log('done downloading modern assets');
}

main().catch(console.error);
