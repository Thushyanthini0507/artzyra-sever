/**
 * Artist Public & Admin Routes
 * Exposes approved artists publicly and provides admin-only moderation
 */
import express from "express";
import {
  getArtists,
  getArtistById,
} from "../controllers/artistPublicController.js";
import {
  getPendingArtists,
  approveArtist,
  rejectArtist,
} from "../controllers/artistController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin-only moderation endpoints
router.get(
  "/pending",
  verifyToken,
  verifyRole("admin"),
  checkApproval,
  getPendingArtists
);

router.put(
  "/approve/:id",
  verifyToken,
  verifyRole("admin"),
  checkApproval,
  approveArtist
);

router.delete(
  "/reject/:id",
  verifyToken,
  verifyRole("admin"),
  checkApproval,
  rejectArtist
);

// Public endpoints for approved artists
router.get("/", getArtists);
router.get("/:id", getArtistById);

export default router;
