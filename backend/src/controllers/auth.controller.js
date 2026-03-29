import {
  createUser,
  findUserByEmail,
  findUserById,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
  saveRefreshToken,
  saveEmailVerificationToken,
} from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendEmail } from "../utils/mail.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await findUserById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  const existedUser = await findUserByEmail(email);

  if (existedUser) {
    throw new ApiError(409, "User with email already exists", []);
  }

  const result = await createUser(firstName, lastName, email, password, role);

  const user = await findUserById(result.insertId);

  if (!user) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  const { unHashedToken, hashedToken, tokenExpiry } = generateTemporaryToken();

  await saveEmailVerificationToken(user.id, hashedToken, new Date(tokenExpiry));

  await sendEmail({
    to: user.email,
    subject: "Please verify your email",
    emailTextual: `Please verify your email by visiting this link: ${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    emailHTML: `<p>Please verify your email by clicking the link below:</p>
                <a href="${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}">
                  Verify Email
                </a>`,
  });

  const createdUser = await findUserById(user.id);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while fetching created user");
  }

  const safeUser = {
    id: createdUser.id,
    firstName: createdUser.first_name,
    lastName: createdUser.last_name,
    email: createdUser.email,
    role: createdUser.role,
    isEmailVerified: createdUser.is_email_verified,
    createdAt: createdUser.created_at,
    updatedAt: createdUser.updated_at,
  };

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: safeUser },
        "User registered successfully and verification email has been sent on your email",
      ),
    );
});

export { registerUser, generateAccessAndRefreshTokens };
