import https from 'https';
import fs from 'fs';

https.get('https://models.readyplayer.me/64b55be4f29107ccfaee3ecb.glb?morphTargets=ARKit', (res) => {
    console.log('Got response: ' + res.statusCode);
    if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        console.log('Redirecting to: ' + res.headers.location);
        https.get(res.headers.location, (res2) => {
            console.log('Redirect response: ' + res2.statusCode);
            res2.pipe(fs.createWriteStream('public/avatar.glb'));
            res2.on('end', () => console.log('Downloaded redirected avatar.glb successfully'));
        }).on('error', e => console.error(e));
    } else {
        res.pipe(fs.createWriteStream('public/avatar.glb'));
        res.on('end', () => console.log('Downloaded avatar.glb successfully'));
    }
}).on('error', (e) => {
    console.error(e);
});
