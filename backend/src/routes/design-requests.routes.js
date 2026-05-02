import express from "express";
import rateLimit from "express-rate-limit";
import {
  createDesignRequest,
  listMyDesignRequests,
  getMyDesignRequestDetail,
  listAllDesignRequests,
  getDesignRequestDetailForAdmin,
  updateDesignRequestStatus,
  updateDesignRequestResult,
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

const designRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});

const router = express.Router();

router.use(designRequestLimiter, verifyJWT);

router
  .route("/")
  .post(
    designRequestReferenceUploadMiddleware,
    createDesignRequestValidator(),
    validate,
    createDesignRequest,
  );

router
  .route("/mine")
  .get(listMyDesignRequestsQueryValidator(), validate, listMyDesignRequests);

router
  .route("/mine/:requestId")
  .get(designRequestIdValidator(), validate, getMyDesignRequestDetail);

router
  .route("/admin")
  .get(
    verifyAdmin,
    listAllDesignRequestsQueryValidator(),
    validate,
    listAllDesignRequests,
  );

router
  .route("/admin/:requestId")
  .get(
    verifyAdmin,
    designRequestIdValidator(),
    validate,
    getDesignRequestDetailForAdmin,
  );

router
  .route("/admin/:requestId/status")
  .patch(
    verifyAdmin,
    updateDesignRequestStatusValidator(),
    validate,
    updateDesignRequestStatus,
  );

router
  .route("/admin/:requestId/result")
  .patch(
    verifyAdmin,
    updateDesignRequestResultValidator(),
    validate,
    updateDesignRequestResult,
  );

export default router;
