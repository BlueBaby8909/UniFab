import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import { ApiError } from "./api-error.js";

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
    throw new ApiError(500, "Failed to send email");
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

const printRequestStatusMailgenContent = ({
  username,
  referenceNumber,
  statusLabel,
  note,
}) => {
  return {
    body: {
      name: username,
      intro: `Your UniFab print request ${referenceNumber} has been updated.`,
      table: {
        data: [
          {
            item: "Current Status",
            description: statusLabel,
          },
          ...(note
            ? [
                {
                  item: "Note",
                  description: note,
                },
              ]
            : []),
        ],
        columns: {
          customWidth: {
            item: "30%",
            description: "70%",
          },
        },
      },
      outro:
        "You can log in to your UniFab account to view the full request details and status history.",
    },
  };
};

export {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  printRequestStatusMailgenContent,
  sendEmail,
};
