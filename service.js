const Service = require('node-windows').Service;
const svc = new Service({
    name: 'Fleet Visual Checker',
    description: 'Fleet Visual last seen checker',
    script: 'C:\\Fleet Visual\\LastSeenChecker\\app.js'
});

svc.on('install', ()=> {
    svc.start();
});

svc.install();