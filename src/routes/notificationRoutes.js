/**
 * Notification Routes
 * Routes for managing user notifications
 */
import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { verifyToken, checkApproval } from "../middleware/authMiddleware.js";
import { verifyRole } from "../middleware/roleMiddleware.js";

const router = express.Router();
const notificationRoles = ["admin", "artist", "customer"];

// All notification routes require authentication
router.use(verifyToken);
router.use(checkApproval);
router.use(verifyRole(notificationRoles));

// RESTful notification routes
router.get("/", getNotifications);
router.put("/:notificationId/read", markNotificationAsRead);
router.put("/read-all", markAllNotificationsAsRead);
router.delete("/:notificationId", deleteNotification);

export default router;
