/**
 *  wkhtmltox binary is required. You can download it from:
 *    http://wkhtmltopdf.org/downloads.html
 *  Also, you need to install xvfb to fix the bug of wkhtmltopdf by:
 *    sudo apt install xvfb
 *  
 *  Test case:
 *      x%20%3D%20%7B-b%20%5Cpm%20%5Csqrt%7Bb%5E2-4ac%7D%20%5Cover%202a%7D.
 * 
 *  Bug:
 *      
 */

'use strict';

let katex = require('katex');
let gm = require('gm').subClass({imageMagick: true});
let fs = require('fs');
let stream = require('stream');

let md5 = require('./md5');
let config = require('./config');
let helper = require('./katex-helper');

let handler = (req, res) => {
    let expr = req.params.expr;

    // Set correct header.
    res.set('Content-Type', 'image/jpeg');
    
    // Get the MD5 checksum of our expr. We do not need to rerender it if cached.
    let hash = md5(expr);

    fs.readFile(`${config.cache}/${hash}.trim.jpg`, (err, content) => {
        if (err) {
            // Not found. Convert LaTeX expression to HTML code.
            let html = [
                '<html>',
                    '<head>',
                        '<meta charset="UTF-8"/>',
                        '<link href="http://cdn.bootcss.com/KaTeX/0.5.1/katex.min.css" rel="stylesheet">',
                        '<style>',
                            'html, body { display: inline-block; witdh: 400px;}',
                        '</style>',
                    '</head>',
                    '<body>',
                        katex.renderToString(expr),
                    '</body>',
                '</html>'
            ].join('');

            // Write to ${hash}.html
            fs.writeFile(`${config.cache}/${hash}.html`, html, (err) => {
                if (err) {
                    // I dont wanna think about it now. Handle it later.
                    throw err;
                }
                helper.getTaskQueue().push({
                    command: `xvfb-run --server-args="-screen 0 640x480x24" wkhtmltoimage ${config.cache}/${hash}.html ${config.cache}/${hash}.jpg`,
                    callback: function (err, stdout, stderr) {
                        // console.log([err, stdout, stderr]);
                        // Let's just ignore [err, stdout, stderr] and assume that we had a great success. Read image from file.
                        fs.readFile(`${config.cache}/${hash}.jpg`, (err, content) => {
                            if (err) {
                                // Oh great success seems to be a failure. Send a 500.
                                res.set('Content-Type', 'text/plain');
                                res.status(500);
                                res.send('喵喵喵？');
                            }
                            else {
                                gm(content, "dummy.jpg")
                                    .trim()
                                    .setFormat('jpg')
                                    .toBuffer((err, buffer) => {
                                        if (err) {
                                            res.set('Content-Type', 'text/plain');
                                            res.send('500: ' + err);
                                            return;
                                        }
                                        res.send(buffer);
                                        fs.writeFile(`${config.cache}/${hash}.trim.jpg`, buffer, () => {})
                                    });
                            }
                        })
                    }
                });
            })
        }
        else {
             res.send(content);
        }
    });
};

module.exports = handler;
