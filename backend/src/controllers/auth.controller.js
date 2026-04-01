import {
  createUser,
  findUserByEmail,
  findUserById,
  isPasswordCorrect,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
  saveRefreshToken,
  saveEmailVerificationToken,
  clearRefreshToken,
} from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendEmail, emailVerificationMailgenContent } from "../utils/mail.js";

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
    console.error("generateAccessAndRefreshTokens error:", error);
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
    mailgenContent: emailVerificationMailgenContent(
      `${user.first_name} ${user.last_name}`,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
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

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(400, "User with email not found");
  }

  const isMatch = await isPasswordCorrect(password, user.password);

  if (!isMatch) {
    throw new ApiError(400, "Incorrect password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id,
  );

  const loggedInUser = await findUserById(user.id);

  const safeUser = {
    id: loggedInUser.id,
    firstName: loggedInUser.first_name,
    lastName: loggedInUser.last_name,
    email: loggedInUser.email,
    role: loggedInUser.role,
    isEmailVerified: loggedInUser.is_email_verified,
    createdAt: loggedInUser.created_at,
    updatedAt: loggedInUser.updated_at,
  };

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: safeUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userID = req.user?.id;

  if (!userID) {
    throw new ApiError(401, "Unauthorized");
  }

  await clearRefreshToken(userID);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
