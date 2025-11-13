/**
 * Artist Public Routes
 * Exposes approved artists without authentication
 */
import express from "express";
import {
  getArtists,
  getArtistById,
} from "../controllers/artistPublicController.js";

const router = express.Router();

router.get("/", getArtists);
router.get("/:id", getArtistById);

export default router;
