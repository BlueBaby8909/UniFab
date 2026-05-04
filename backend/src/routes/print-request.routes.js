import express from "express";
import {
  submitPrintRequest,
  listMyPrintRequests,
  getMyPrintRequestDetail,
  listAllPrintRequests,
  updatePrintRequestStatus,
  archivePrintRequest,
  deletePrintRequest,
  uploadPrintRequestPaymentSlip,
  uploadPrintRequestReceipt,
  getPrintRequestReceipt,
} from "../controllers/print-request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  printRequestPaymentSlipUploadMiddleware,
  printRequestReceiptUploadMiddleware,
} from "../middlewares/print-request-upload.middleware.js";
import {
  submitPrintRequestValidator,
  printRequestIdValidator,
  listMyPrintRequestsQueryValidator,
  listAllPrintRequestsQueryValidator,
  updatePrintRequestStatusValidator,
  uploadPrintRequestPaymentSlipValidator,
  uploadPrintRequestReceiptValidator,
} from "../validators/print-request.validator.js";
import {
  authenticatedReadRateLimiter,
  uploadRateLimiter,
  writeRateLimiter,
} from "../middlewares/rate-limit.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/admin")
  .get(
    authenticatedReadRateLimiter,
    verifyAdmin,
    listAllPrintRequestsQueryValidator(),
    validate,
    listAllPrintRequests,
  );

router
  .route("/admin/:requestId")
  .delete(
    writeRateLimiter,
    verifyAdmin,
    printRequestIdValidator(),
    validate,
    deletePrintRequest,
  );

router
  .route("/admin/:requestId/status")
  .put(
    writeRateLimiter,
    verifyAdmin,
    updatePrintRequestStatusValidator(),
    validate,
    updatePrintRequestStatus,
  );

router
  .route("/admin/:requestId/archive")
  .patch(
    writeRateLimiter,
    verifyAdmin,
    printRequestIdValidator(),
    validate,
    archivePrintRequest,
  );

router
  .route("/admin/:requestId/payment-slip")
  .post(
    uploadRateLimiter,
    verifyAdmin,
    printRequestPaymentSlipUploadMiddleware,
    uploadPrintRequestPaymentSlipValidator(),
    validate,
    uploadPrintRequestPaymentSlip,
  );

router
  .route("/")
  .get(
    authenticatedReadRateLimiter,
    listMyPrintRequestsQueryValidator(),
    validate,
    listMyPrintRequests,
  )
  .post(
    writeRateLimiter,
    submitPrintRequestValidator(),
    validate,
    submitPrintRequest,
  );

router
  .route("/:requestId/receipt")
  .get(
    authenticatedReadRateLimiter,
    printRequestIdValidator(),
    validate,
    getPrintRequestReceipt,
  )
  .post(
    uploadRateLimiter,
    printRequestReceiptUploadMiddleware,
    uploadPrintRequestReceiptValidator(),
    validate,
    uploadPrintRequestReceipt,
  );

router
  .route("/:requestId")
  .get(
    authenticatedReadRateLimiter,
    printRequestIdValidator(),
    validate,
    getMyPrintRequestDetail,
  );

export default router;
