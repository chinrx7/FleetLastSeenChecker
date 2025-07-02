const schedule = require('node-schedule');
const fleet = require('./middleware/fleet');
const logger = require('./middleware/log');
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('./config/app.json'));

const rule = new schedule.RecurrenceRule();

logger.loginfo('app start at ')

//fleet.testMail();
fleet.CheckLastSeen();
const job = schedule.scheduleJob(`*/${cfg.config.check_every} * * * * `, function () {
    logger.loginfo('app tick');
    try {
        fleet.CheckLastSeen();
        fleet.engineCheck();
    }
    catch (ex) {
        logger.loginfo`app ${ex}`
    }
})