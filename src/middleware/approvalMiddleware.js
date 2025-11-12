const checkApproval = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }

  // Admins are always approved
  if (req.userRole === "admin") {
    return next();
  }

  // Check if user is approved
  if (!req.user.isApproved) {
    return res.status(403).json({
      success: false,
      message:
        "Your account is pending approval. Please wait for admin approval.",
    });
  }

  // Check if user is active
  if (req.user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: "Your account has been deactivated. Please contact support.",
    });
  }

  next();
};

export default checkApproval;
