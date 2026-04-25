import express from "express";
import rateLimit from "express-rate-limit";
import {
  submitPrintRequest,
  listMyPrintRequests,
  getMyPrintRequestDetail,
  listAllPrintRequests,
  updatePrintRequestStatus,
  uploadPrintRequestReceipt,
} from "../controllers/print-request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  printRequestModelUploadMiddleware,
  printRequestReceiptUploadMiddleware,
} from "../middlewares/print-request-upload.middleware.js";
import {
  submitPrintRequest,
  listMyPrintRequests,
  getMyPrintRequestDetail,
  listAllPrintRequests,
  updatePrintRequestStatus,
  uploadPrintRequestReceipt,
  getPrintRequestReceipt,
} from "../controllers/print-request.controller.js";

const printRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

const router = express.Router();

router.use(printRequestLimiter, verifyJWT);

router
  .route("/admin")
  .get(
    verifyAdmin,
    listAllPrintRequestsQueryValidator(),
    validate,
    listAllPrintRequests,
  );

router
  .route("/admin/:requestId/status")
  .put(
    verifyAdmin,
    updatePrintRequestStatusValidator(),
    validate,
    updatePrintRequestStatus,
  );

router
  .route("/")
  .get(listMyPrintRequestsQueryValidator(), validate, listMyPrintRequests)
  .post(
    printRequestModelUploadMiddleware,
    submitPrintRequestValidator(),
    validate,
    submitPrintRequest,
  );

router
  .route("/:requestId/receipt")
  .get(printRequestIdValidator(), validate, getPrintRequestReceipt)
  .post(
    printRequestReceiptUploadMiddleware,
    uploadPrintRequestReceiptValidator(),
    validate,
    uploadPrintRequestReceipt,
  );

router
  .route("/:requestId")
  .get(printRequestIdValidator(), validate, getMyPrintRequestDetail);

export default router;
