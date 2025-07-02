const axios = require('axios');
const sender = require('./notification');
const fs = require('fs');
const qstr = require('querystring');
const data = qstr.stringify({ grant_type: 'password', username: 'sat', password: '1234' });
const logger = require('./log');
const cfg = JSON.parse(fs.readFileSync('./config/app.json'));


module.exports.CheckLastSeen = async () => {
    const tags = this.getTagConfig();


    let treq = [];
    for (const t of tags.Vessels) {
        if (t.Enable === 1) {
            const r = { name: t.Name, tagName: t.Tag };
            treq.push(r);
        }
    }

    let token;
    await axios.post('https://www.fleetvisual.com/token', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
        .then(response => token = `${response.data.token_type} ${response.data.access_token}`)
        .catch(error => logger.loginfo(`Fleet api autenication error ${error}`));

    let rdata;
    await axios.post('https://www.fleetvisual.com/api/vessels/getcurrentvalues', treq, { headers: { Authorization: token } })
        .then((res) => {
            rdata = res.data;
        })
        .catch(error => logger.loginfo(`Fleet api get current value error ${error}`))

    //console.log(rdata)
    const cdate = new Date();

    let txtAlert = '';

    for (const r of rdata) {
        const ldate = new Date(r.dateTime);
        const diffMilliseconds = Math.abs(cdate - ldate);
        const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60));
        //txtAlert =  txtAlert + `${r.name} last seen ${diffMinutes} minutes ago \r\n`;
        if (diffMinutes >= cfg.config.time_limit) {
            txtAlert = txtAlert + `${r.name} last seen ${diffMinutes} minutes ago\r\n`;
        }
    }

    // const chkEngine = await this.engineCheck();
    // console.log(chkEngine)
    // if (chkEngine.length > 0) {
    //     txtAlert = txtAlert + chkEngine;
    // }

    if (txtAlert.length > 0) {
        logger.loginfo(`last seen exeed time limit ${txtAlert}`);
        const mailbody = `Dear All, \r\nPlease keep your eye on Vessels listed below \r\n\r\n${txtAlert}`;
        sender.mailSend(cfg.mail, 'Fleet Visual Notification', mailbody);

    }

    //sender.mailSend('satsdevteam@gmail.com','Fleet Visual Notification','test')
}

module.exports.engineCheck = async () => {

    let txtAlert;
    
    const cfg = this.getEngineConfig();
    let treq = [];
    for (const c of cfg.Checkers) {
        if (c.Enable === 1) {
            for (const e of c.Engine) {
                for (const t of e.Tag) {
                    const r = { name: `${c.Prefix}-${e.Name}-${t}`, tagName: `${c.Prefix}-${e.Name}-${t}` };
                    treq.push(r);
                }
            }
        }
    }

    //console.log(treq)

    let token;
    await axios.post('https://www.fleetvisual.com/token', data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
        .then(response => token = `${response.data.token_type} ${response.data.access_token}`)
        .catch(error => logger.loginfo(`Fleet api autenication error ${error}`));

    let rdata;
    await axios.post('https://www.fleetvisual.com/api/vessels/getcurrentvalues', treq, { headers: { Authorization: token } })
        .then((res) => {
            rdata = res.data;
        })
        .catch(error => logger.loginfo(`Fleet api get current value error ${error}`))

   //console.log(rdata)

    for (const c of cfg.Checkers) {
        const tres = rdata.filter(d => d.tagName.startsWith(c.Prefix));

        for (const r of tres) {
            if (r.dateTime) {
                const chkdiff = checkTimediff(r.dateTime);
                if (chkdiff >= 60) {
                    const spt = r.tagName.split('-')
                    txtAlert = txtAlert + `${c.Name} engine ${spt[1]} ${spt[2]} value has not been updated in the last ${chkdiff} minutes ago \r\n\r\n`
                }
            }
        }
    }

    if (txtAlert.length > 0) {
        logger.loginfo(`last seen exeed time limit ${txtAlert}`);
        const mailbody = `Dear All, \r\nPlease keep your eye on Vessels listed below \r\n\r\n${txtAlert}`;
        sender.mailSend(cfg.mail, 'Fleet Visual Notification', mailbody);
    }
}

checkTimediff = (time) => {
    const cdate = new Date();
    const ldate = new Date(time);
    const diffMilliseconds = Math.abs(cdate - ldate);
    const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60));

    return diffMinutes;
}

module.exports.testMail = async ()=>{
    const txtAlert = 'This is test from system \r\n SC PAILIN last seen 63 minutes ago\r\n'
    const mailbody = `Dear All, \r\nPlease keep your eye on Vessels listed below \r\n\r\n${txtAlert}`;
    sender.mailSend(cfg.mail, 'Fleet Visual Notification', mailbody);

}

module.exports.getTagConfig = () => {
    const vessels = JSON.parse(fs.readFileSync('./config/vessel.json', 'utf8'));
    return vessels;
}

module.exports.getEngineConfig = () => {
    const engines = JSON.parse(fs.readFileSync('./config/cEngine.json', 'utf-8'));
    return engines;
}