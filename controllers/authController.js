import User from "../models/User.js";

// Get all user
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      length: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Get a user by Id
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById({ _id: userId });

    if (!user) return res.status(404).json({ Message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Create a user
export const createUser = async (req, res) => {
  try {
    const newUser = new User(req.body);

    const savedUser = await newUser.save();
    res.status(200).json({
      Message: "user created successfully",
      user: savedUser,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Update a user by Id
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const userExist = await User.findById({ _id: userId });
    if (!userExist) return res.status(404).json({ Error: "user not found" });

    const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
    });
    res.status(200).json({
      Message: "user updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

// Delete a user by Id
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ Message: "user not found" });
    res.status(200).json({
      Message: "user removed successfully",
      deletedUser: user,
    });
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};
