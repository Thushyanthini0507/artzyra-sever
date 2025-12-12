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
 * Get notifications with search and filtering
 * @route GET /api/notifications
 * Query params: search, type, isRead, startDate, endDate, page, limit, sortBy, sortOrder
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const {
    search,
    type,
    isRead,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const userModel = mapRoleToModel(req.userRole);

  const query = {
    user: req.userId,
    userModel,
  };

  // Status filter
  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }

  // Type filter
  if (type) {
    query.type = type;
  }

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Search filter
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNum = parseInt(limit, 10);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const notifications = await Notification.find(query)
    .skip(skip)
    .limit(limitNum)
    .sort(sort);

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    user: req.userId,
    userModel,
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

