const emailSend = require("nodemailer");
const path = require("path");
const moment = require("moment");

exports.emailSendVerif = (req, res, next, { email = null, code = "" }) =>

  {
    try {
      return new Promise((resolve, reject) => {
        let transporter = emailSend.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: "abdulfahmi78@gmail.com",
            pass: "sgjraytirpbfilbp",

          },
          from: "abdulfahmi78@gmail.com",
        });
        var mailOptions = {
          from: process.env.EMAIL_SMTP,
          to: email,
          subject: "[VERIFIKASI] Pendaftaran Aplikasi Bogor Ngawas ",
          html: `<center><h4>Verifikasi Kode OTP Pendaftaran Aplikasi Bogor Ngawas</h4></center>
                        <p>Ini kode verifikasi anda, berlaku selama 5 menit,
                        jika tidak, kode verifikasi ini tidak akan berlaku lagi.</p>
                        <center><b><h2>${code}</h2></b></center>`,

        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log({ error: error.message });
            reject(error);
          } else {
            console.log("Email sent: " + info.response);
            resolve(info);
          }
        });
      });
    } catch (error) {
      return error;
    }
  };
