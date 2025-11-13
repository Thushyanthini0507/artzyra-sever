/**
 * Notification Controller
 * Handles fetching and managing notifications for different user roles
 */
import Notification from "../models/Notification.js";
import {
  NotFoundError,
  ForbiddenError,
} from "../utils/errors.js";
import { asyncHandler } from "../middleware/authMiddleware.js";
import { formatPaginationResponse } from "../utils/paginate.js";

const mapRoleToModel = (role) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "artist":
      return "Artist";
    case "customer":
      return "Customer";
    default:
      return null;
  }
};

/**
 * Get notifications for the authenticated user with pagination
 * @route GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { isRead, page = 1, limit = 20 } = req.query;

  const userModel = mapRoleToModel(req.userRole);

  const query = {
    user: req.userId,
    userModel,
  };

  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);

  const notifications = await Notification.find(query)
    .populate("relatedId")
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    ...query,
    isRead: false,
  });

  const response = formatPaginationResponse(notifications, total, page, limit);

  res.json({
    success: true,
    data: {
      notifications: response.data,
      unreadCount,
      pagination: response.pagination,
    },
  });
});

/**
 * Mark a single notification as read
 * @route PUT /api/notifications/:notificationId/read
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  if (notification.user.toString() !== req.userId.toString()) {
    throw new ForbiddenError(
      "You are not authorized to update this notification"
    );
  }

  notification.isRead = true;
  await notification.save();

  res.json({
    success: true,
    message: "Notification marked as read",
    data: {
      notification,
    },
  });
});

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userModel = mapRoleToModel(req.userRole);

  await Notification.updateMany(
    {
      user: req.userId,
      userModel,
      isRead: false,
    },
    { isRead: true }
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

/**
 * Delete a notification
 * @route DELETE /api/notifications/:notificationId
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  if (notification.user.toString() !== req.userId.toString()) {
    throw new ForbiddenError(
      "You are not authorized to delete this notification"
    );
  }

  await Notification.findByIdAndDelete(notificationId);

  res.json({
    success: true,
    message: "Notification deleted successfully",
  });
});

