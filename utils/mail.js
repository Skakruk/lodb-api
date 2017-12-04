const Mailgun = require('mailgun-js');

const mailgun = Mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: 'lodb.org.ua'
});

module.exports = {
    send(data) {
        return mailgun.messages().send(data);
    }
};
