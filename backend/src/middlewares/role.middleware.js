import { ApiError } from "../utils/api-error.js";

export const verifyAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    throw new ApiError(403, "Forbidden: Admin access required");
  }

  next();
};
