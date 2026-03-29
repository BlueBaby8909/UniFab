import pool from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

async function createUser(firstName, lastName, email, password, role) {
  const sql = `
    INSERT INTO users (
      first_name,
      last_name,
      email,
      password,
      role,
      is_email_verified,
      refresh_token,
      forgot_password_token,
      forgot_password_expiry,
      email_verification_token,
      email_verification_expiry
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await pool.query(sql, [
    firstName,
    lastName,
    email.trim().toLowerCase(),
    hashedPassword,
    role,
    false,
    null,
    null,
    null,
    null,
    null,
  ]);

  return result;
}

async function findUserByEmail(email) {
  const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";
  const [rows] = await pool.query(sql, [email.trim().toLowerCase()]);
  return rows[0] || null;
}

async function findUserById(id) {
  const sql = "SELECT * FROM users WHERE id = ? LIMIT 1";
  const [rows] = await pool.query(sql, [id]);
  return rows[0] || null;
}

async function isPasswordCorrect(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
}

function generateTemporaryToken() {
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry = Date.now() + 20 * 60 * 1000;

  return {
    unHashedToken,
    hashedToken,
    tokenExpiry,
  };
}

async function saveRefreshToken(userId, refreshToken) {
  const sql = "UPDATE users SET refresh_token = ? WHERE id = ?";
  const [result] = await pool.query(sql, [refreshToken, userId]);
  return result;
}

async function saveForgotPasswordToken(
  userId,
  forgotPasswordToken,
  forgotPasswordExpiry,
) {
  const sql = `
    UPDATE users
    SET forgot_password_token = ?, forgot_password_expiry = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(sql, [
    forgotPasswordToken,
    forgotPasswordExpiry,
    userId,
  ]);
  return result;
}

async function saveEmailVerificationToken(
  userId,
  emailVerificationToken,
  emailVerificationExpiry,
) {
  const sql = `
    UPDATE users
    SET email_verification_token = ?, email_verification_expiry = ?
    WHERE id = ?
  `;
  const [result] = await pool.query(sql, [
    emailVerificationToken,
    emailVerificationExpiry,
    userId,
  ]);
  return result;
}

async function verifyEmail(userId) {
  const sql = `
    UPDATE users
    SET
      is_email_verified = true,
      email_verification_token = NULL,
      email_verification_expiry = NULL
    WHERE id = ?
  `;
  const [result] = await pool.query(sql, [userId]);
  return result;
}

export {
  createUser,
  findUserByEmail,
  findUserById,
  isPasswordCorrect,
  generateAccessToken,
  generateRefreshToken,
  generateTemporaryToken,
  saveRefreshToken,
  saveForgotPasswordToken,
  saveEmailVerificationToken,
  verifyEmail,
};
