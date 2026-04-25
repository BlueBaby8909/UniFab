import express from "express";
import rateLimit from "express-rate-limit";
import {
  searchDesignLibrary,
  getMmfDesignDetail,
  listLocalDesigns,
  getLocalDesignDetail,
  createLocalDesign,
  updateLocalDesign,
  deactivateLocalDesign,
  listDesignOverrides,
  createDesignOverride,
  updateDesignOverride,
  deleteDesignOverride,
} from "../controllers/designs.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/role.middleware.js";
import { localDesignUploadMiddleware } from "../middlewares/local-design-upload.middleware.js";
import {
  searchDesignLibraryValidator,
  mmfObjectIdValidator,
  localDesignIdValidator,
  createLocalDesignValidator,
  updateLocalDesignValidator,
  deactivateLocalDesignValidator,
  overrideIdValidator,
  createDesignOverrideValidator,
  updateDesignOverrideValidator,
} from "../validators/designs.validator.js";

const designLibraryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
});

const router = express.Router();

router
  .route("/")
  .get(
    designLibraryLimiter,
    searchDesignLibraryValidator(),
    validate,
    searchDesignLibrary,
  );

router
  .route("/mmf/:objectId")
  .get(
    designLibraryLimiter,
    mmfObjectIdValidator(),
    validate,
    getMmfDesignDetail,
  );

router.route("/local").get(designLibraryLimiter, listLocalDesigns);

router
  .route("/local/:designId")
  .get(
    designLibraryLimiter,
    localDesignIdValidator(),
    validate,
    getLocalDesignDetail,
  )
  .patch(
    designLibraryLimiter,
    verifyJWT,
    verifyAdmin,
    localDesignUploadMiddleware,
    updateLocalDesignValidator(),
    validate,
    updateLocalDesign,
  );

router
  .route("/local")
  .post(
    designLibraryLimiter,
    verifyJWT,
    verifyAdmin,
    localDesignUploadMiddleware,
    createLocalDesignValidator(),
    validate,
    createLocalDesign,
  );

router
  .route("/local/:designId/deactivate")
  .patch(
    designLibraryLimiter,
    verifyJWT,
    verifyAdmin,
    deactivateLocalDesignValidator(),
    validate,
    deactivateLocalDesign,
  );

router
  .route("/admin/overrides")
  .get(designLibraryLimiter, verifyJWT, verifyAdmin, listDesignOverrides)
  .post(
    designLibraryLimiter,
    verifyJWT,
    verifyAdmin,
    createDesignOverrideValidator(),
    validate,
    createDesignOverride,
  );

router
  .route("/admin/overrides/:overrideId")
  .patch(
    designLibraryLimiter,
    verifyJWT,
    verifyAdmin,
    updateDesignOverrideValidator(),
    validate,
    updateDesignOverride,
  )
  .delete(
    designLibraryLimiter,
    verifyJWT,
    verifyAdmin,
    overrideIdValidator(),
    validate,
    deleteDesignOverride,
  );

export default router;
