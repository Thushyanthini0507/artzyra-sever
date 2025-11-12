import express from "express";
const router = express.Router();
import Notification from "../models/Notification.js";
import authenticate from "../middleware/authMiddleware.js";
import checkApproval from "../middleware/approvalMiddleware.js";

// All notification routes require authentication
router.use(authenticate);
router.use(checkApproval);

// Get user notifications
router.get("/", async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;

    const query = {
      user: req.userId,
      userModel:
        req.userRole === "admin"
          ? "Admin"
          : req.userRole === "artist"
          ? "Artist"
          : "Customer",
    };

    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.find(query)
      .populate("relatedId")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.put("/:notificationId/read", async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.user.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this notification",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      data: {
        notification,
      },
      message: "Notification marked as read",
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.put("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        user: req.userId,
        userModel:
          req.userRole === "admin"
            ? "Admin"
            : req.userRole === "artist"
            ? "Artist"
            : "Customer",
        isRead: false,
      },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
});

// Delete notification
router.delete("/:notificationId", async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.user.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this notification",
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
