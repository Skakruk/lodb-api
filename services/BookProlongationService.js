const mailService = require('../utils/mail');

module.exports = {
    requestProlongation(body){
        const mail = {
            from: 'Робот ЛОДБ <no-reply@lodb.org.ua>',
            to: 'skakruk15@gmail.com, starshi@lodb.org.ua, malyuky@lodb.org.ua',
            subject: 'Новий запит на подовження книг з сайту',
            'h:Reply-To': body.email,
            html: `
<p>${body.name}</b> хоче подовжити книгу. Нижче наведені деталі повідомлення:</p>
<p><b>Ім'я:</b> ${body.name}</p>
<p><b>Email:</b> ${body.email}</p>
<p><b>Відділ:</b> ${body.department}</p>
<p><b>Школа / клас:</b> ${body.school}</p>
<p>Для зв'язку з отримувачем, використовуйте наступне посилання: <a href="mailto:${body.email}?subject=RE: Новий запит на подовження книг з сайту">${body.email}</a></p>`
        };

        return mailService.send(mail)
    }
};