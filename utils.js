'use strict';

let crypto = require('crypto');
let fs = require('fs');
let config = require('./config');

let randomString = (length) => {
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = '';
    for(let i = 0; i < length; i++)
        res += possible.charAt(Math.floor(Math.random() * possible.length));
    return res;
}


(function() {
    config.log || console.log('[WARN] Log file is undefined!');
})();

let logTool = (req, res, next) => {
    let content = `[${new Date().toLocaleString()}] ${req.headers['x-real-ip'] || req.ip}: ${req.method} ${req.url}`;
    console.log(content);
    content += '\n';
    config.log && fs.appendFile(config.log, content, (err) => {
        if (err) {
            fs.writeFile(config.log, content, () => {})
        }
    });
    next();
}

module.exports = {
    md5: function (content) {
        return require('crypto').createHash('md5').update(content, 'utf8').digest('hex');
    },
    logTool
}