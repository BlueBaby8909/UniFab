import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerificationEmail,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  userRegisterValidator,
  userLoginValidator,
  userChangePasswordValidator,
  userForgotPasswordValidator,
  userResetForgotPasswordValidator,
  verifyEmailTokenValidator,
  resetForgotPasswordTokenValidator,
  refreshAccessTokenValidator,
} from "../validators/auth.validator.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const router = express.Router();

//unsecured routes
router
  .route("/register")
  .post(authLimiter, userRegisterValidator(), validate, registerUser);
router
  .route("/login")
  .post(authLimiter, userLoginValidator(), validate, loginUser);
router
  .route("/verify-email/:verificationToken")
  .get(verifyEmailTokenValidator(), validate, verifyEmail);
router
  .route("/refresh-token")
  .post(refreshAccessTokenValidator(), validate, refreshAccessToken);
router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
  .route("/reset-forgot-password/:resetToken")
  .post(
    resetForgotPasswordTokenValidator(),
    userResetForgotPasswordValidator(),
    validate,
    resetForgotPassword,
  );

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangePasswordValidator(),
    validate,
    changeCurrentPassword,
  );
router
  .route("/resend-verification-email")
  .post(verifyJWT, resendVerificationEmail);

export default router;
