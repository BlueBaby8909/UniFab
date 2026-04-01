import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "UniFab",
      link: "https://unifab.com",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHTML = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const mail = {
    from: "UniFab <support@unifab.com>",
    to: options.to,
    subject: options.subject,
    text: emailTextual,
    html: emailHTML,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("Email service failed to send email:", error);
  }
};

const emailVerificationMailgenContent = (username, verificationLink) => {
  return {
    body: {
      name: username,
      intro: "Welcome to UniFab! We're very excited to have you on board.",
      action: {
        instructions:
          "To get started with your account, please click on the following button:",
        button: {
          text: "Verify Email",
          link: verificationLink,
        },
      },
      outro:
        "If you did not sign up for this account, please ignore this email.",
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResetLink) => {
  return {
    body: {
      name: username,
      intro: "You have requested to reset your password.",
      action: {
        instructions:
          "To reset your password, please click on the following button:",
        button: {
          text: "Reset Password",
          link: passwordResetLink,
        },
      },
      outro:
        "If you did not sign up for this account, please ignore this email.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
};
