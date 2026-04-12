import { body, param } from "express-validator";

const userRegisterValidator = () => {
  return [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .bail()
      .isLength({ min: 2, max: 50 })
      .withMessage("First name must be between 2 and 50 characters")
      .matches(/^[A-Za-z' -]+$/)
      .withMessage("First name contains invalid characters"),

    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .bail()
      .isLength({ min: 2, max: 50 })
      .withMessage("Last name must be between 2 and 50 characters")
      .matches(/^[A-Za-z' -]+$/)
      .withMessage("Last name contains invalid characters"),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .bail()
      .isLength({ max: 254 })
      .withMessage("Email is too long")
      .bail()
      .isEmail()
      .withMessage("Email is not valid"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Password must contain at least one special character"),

    body("userType")
      .trim()
      .notEmpty()
      .withMessage("User type is required")
      .bail()
      .isIn(["student", "faculty", "researcher", "others"])
      .withMessage("User type must be student, faculty, researcher, or others"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .bail()
      .isLength({ max: 254 })
      .withMessage("Email is too long")
      .bail()
      .isEmail()
      .withMessage("Email is not valid"),

    body("password").notEmpty().withMessage("Password is required"),
  ];
};

const userChangePasswordValidator = () => {
  return [
    body("oldPassword").notEmpty().withMessage("Old password is required"),

    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage("New password must be between 8 and 128 characters long")
      .matches(/[A-Z]/)
      .withMessage("New password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("New password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain at least one number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("New password must contain at least one special character")
      .custom((value, { req }) => {
        if (value === req.body.oldPassword) {
          throw new Error("New password must be different from old password");
        }
        return true;
      }),
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .bail()
      .isLength({ max: 254 })
      .withMessage("Email is too long")
      .bail()
      .isEmail()
      .withMessage("Email is not valid"),
  ];
};

const userResetForgotPasswordValidator = () => {
  return [
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .bail()
      .isLength({ min: 8, max: 128 })
      .withMessage("New password must be between 8 and 128 characters long")
      .matches(/[A-Z]/)
      .withMessage("New password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("New password must contain at least one lowercase letter")
      .matches(/[0-9]/)
      .withMessage("New password must contain at least one number")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("New password must contain at least one special character"),
  ];
};

const verifyEmailTokenValidator = () => {
  return [
    param("verificationToken")
      .trim()
      .notEmpty()
      .withMessage("Verification token is required"),
  ];
};

const resetForgotPasswordTokenValidator = () => {
  return [
    param("resetToken")
      .trim()
      .notEmpty()
      .withMessage("Reset token is required"),
  ];
};

const refreshAccessTokenValidator = () => {
  return [
    body("refreshToken")
      .optional()
      .isString()
      .withMessage("Refresh token must be a string")
      .bail()
      .notEmpty()
      .withMessage("Refresh token cannot be empty"),
  ];
};

export {
  userRegisterValidator,
  userLoginValidator,
  userChangePasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  verifyEmailTokenValidator,
  resetForgotPasswordTokenValidator,
  refreshAccessTokenValidator,
};
