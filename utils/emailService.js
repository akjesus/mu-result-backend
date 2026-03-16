const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');



module.exports = class Email {
  constructor(user, code) {
    this.to = user.email;
    this.firstName = user.first_name;
    this.code = code;
    this.from = 'Maduka University ICT Unit <ict@madukauniversity.edu.ng>';
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: "smtp.gmail.com", 
        port: 587,
        secure: false,
        auth: {
          user: process.env.GOOGLE_APP_USER,
          pass: process.env.GOOGLE_APP_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        code: this.code,
        subject: this.subject,
      }
    );

    //2. Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
    };
    await this.newTransport().sendMail(mailOptions);
  }

  async sendReset() {
    await this.send(
      'passwordReset',
      'Password Reset Code: Valid for 10 Minutes'
    );
  }
};