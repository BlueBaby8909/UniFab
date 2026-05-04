import express from "express";
import {
  createDesignRequest,
  listMyDesignRequests,
  getMyDesignRequestDetail,
  listAllDesignRequests,
  getDesignRequestDetailForAdmin,
  updateDesignRequestStatus,
  updateDesignRequestResult,
  archiveDesignRequest,
  deleteDesignRequest,
} from "../controllers/design-requests.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/role.middleware.js";
import { designRequestReferenceUploadMiddleware } from "../middlewares/design-request-upload.middleware.js";
import {
  designRequestIdValidator,
  createDesignRequestValidator,
  updateDesignRequestStatusValidator,
  updateDesignRequestResultValidator,
  listMyDesignRequestsQueryValidator,
  listAllDesignRequestsQueryValidator,
} from "../validators/design-requests.validator.js";
import {
  authenticatedReadRateLimiter,
  uploadRateLimiter,
  writeRateLimiter,
} from "../middlewares/rate-limit.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/")
  .post(
    uploadRateLimiter,
    designRequestReferenceUploadMiddleware,
    createDesignRequestValidator(),
    validate,
    createDesignRequest,
  );

router
  .route("/mine")
  .get(
    authenticatedReadRateLimiter,
    listMyDesignRequestsQueryValidator(),
    validate,
    listMyDesignRequests,
  );

router
  .route("/mine/:requestId")
  .get(
    authenticatedReadRateLimiter,
    designRequestIdValidator(),
    validate,
    getMyDesignRequestDetail,
  );

router
  .route("/admin")
  .get(
    authenticatedReadRateLimiter,
    verifyAdmin,
    listAllDesignRequestsQueryValidator(),
    validate,
    listAllDesignRequests,
  );

router
  .route("/admin/:requestId")
  .get(
    authenticatedReadRateLimiter,
    verifyAdmin,
    designRequestIdValidator(),
    validate,
    getDesignRequestDetailForAdmin,
  )
  .delete(
    writeRateLimiter,
    verifyAdmin,
    designRequestIdValidator(),
    validate,
    deleteDesignRequest,
  );

router
  .route("/admin/:requestId/status")
  .patch(
    writeRateLimiter,
    verifyAdmin,
    updateDesignRequestStatusValidator(),
    validate,
    updateDesignRequestStatus,
  );

router
  .route("/admin/:requestId/archive")
  .patch(
    writeRateLimiter,
    verifyAdmin,
    designRequestIdValidator(),
    validate,
    archiveDesignRequest,
  );

router
  .route("/admin/:requestId/result")
  .patch(
    writeRateLimiter,
    verifyAdmin,
    updateDesignRequestResultValidator(),
    validate,
    updateDesignRequestResult,
  );

export default router;
