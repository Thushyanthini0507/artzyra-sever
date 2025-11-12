// Helper utility functions

const createNotification = async (Notification, user, userModel, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const notification = await Notification.create({
      user,
      userModel,
      type,
      title,
      message,
      relatedId,
      relatedModel,
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

const calculateBookingAmount = (hourlyRate, duration) => {
  return hourlyRate * duration;
};

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const formatTime = (time) => {
  // Assuming time is in HH:MM format
  return time;
};

const isTimeSlotAvailable = (availability, date, startTime, endTime) => {
  // Placeholder for availability checking logic
  // In production, implement proper time slot validation
  if (!availability || availability.size === 0) {
    return true; // If no availability set, assume available
  }

  const dayOfWeek = new Date(date).getDay();
  const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
  
  const dayAvailability = availability.get(dayKey);
  if (!dayAvailability || !dayAvailability.available) {
    return false;
  }

  // Check if requested time is within available hours
  // This is a simplified check - implement proper time comparison
  return true;
};

const paginate = (page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return { skip, limit: parseInt(limit) };
};

const buildSearchQuery = (searchTerm, searchFields) => {
  if (!searchTerm) return {};
  
  return {
    $or: searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
};

export {
  createNotification,
  calculateBookingAmount,
  formatDate,
  formatTime,
  isTimeSlotAvailable,
  paginate,
  buildSearchQuery,
};

