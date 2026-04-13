const nodemailer = require("nodemailer");

const sendOtpEmail = async (to, otp) => {
  if (!process.env.OTP_EMAIL_USER || !process.env.OTP_EMAIL_PASS) {
    throw new Error("OTP email credentials are missing in environment variables");
  }
  const transporter = nodemailer.createTransport({
    service: process.env.OTP_EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.OTP_EMAIL_USER,
      pass: process.env.OTP_EMAIL_PASS,
    },
  });
  await transporter.verify();

  await transporter.sendMail({
    from: process.env.OTP_EMAIL_USER,
    to,
    subject: "College Portal OTP Verification",
    text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
  });
};

module.exports = { sendOtpEmail };
