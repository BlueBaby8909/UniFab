import { apiRequest } from "./client";

export function loginUser(credentials) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser() {
  return apiRequest("/auth/current-user");
}

export function logoutUser() {
  return apiRequest("/auth/logout", {
    method: "POST",
  });
}

export function registerUser(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyEmail(verificationToken) {
  return apiRequest(`/auth/verify-email/${verificationToken}`);
}

export function resendVerificationEmail() {
  return apiRequest("/auth/resend-verification-email", {
    method: "POST",
  });
}

export function refreshAccessToken() {
  return apiRequest("/auth/refresh-token", {
    method: "POST",
  });
}

export function forgotPassword(payload) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resetForgotPassword(resetToken, payload) {
  return apiRequest(`/auth/reset-forgot-password/${resetToken}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function changeCurrentPassword(payload) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
