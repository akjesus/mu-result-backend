const Staff = require("../models/staffModel");
const bcrypt = require("bcrypt");

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.getAllStaff();
    res.status(200).json({ success: true, code: 200, staff });
  } catch (error) {
    console.log("Error fetching staff:", error);
    res.status(500).json({ success: false, code: 500, message: error.message });
  }
};

exports.getStaffById = async (req, res) => {
  const staffId = parseInt(req.params.id);
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Staff not found" });
    }
    return res.status(200).json({ success: true, code: 200, staff });
  } catch (error) {
    console.log("Error fetching staff by ID:", error.message);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staffId = parseInt(req.params.id);
    const staff = await Staff.findById(staffId);

    if (req.user.role !== "superadmin" || staff.role === "superadmin") {
      return res.status(403).json({
        success: false,
        code: 403,
        message: "You are not allowed to perform this action",
      });
    }

    const deleted = await Staff.deleteStaff(staffId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: "Staff not found or already deleted",
      });
    }
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.log("Error deleting staff:", error);
    return res.status(500).json({ success: false, code: 500, message: error });
  }
};

exports.resetPassword = async (req, res) => {
  const staffId = parseInt(req.params.id);
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Staff not found" });
    }
    if(staff.role === "superadmin") {
      return res.status(403).json({
        success: false, code: 403, message: "You are not allowed to reset password for superadmin"
      });
    }
    const hashedPassword = await bcrypt.hash("staff1234", 10);
    const updated = await Staff.updatePassword(staffId, hashedPassword);
    if (!updated) {
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Failed to update password",
      });
    }
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log("Error resetting password:", error.message);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  const { first_name, last_name, email, username } = req.body;
  if (!first_name || !last_name || !email || !username) {
    return res
      .status(400)
      .json({ success: false, code: 400, message: "All fields are required" });
  }

  try {
    const existingUser = await Staff.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "Username or email already exists",
      });
    }
    const staffId = await Staff.createStaff(
      first_name,
      last_name,
      email,
      username,
    );
    const newStaff = await Staff.findById(staffId);
    return res.status(201).json({
      success: true,
      code: 201,
      message: "Staff created successfully",
      staff: newStaff,
    });
  } catch (error) {
    console.log("Error creating staff:", error.message);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  const staffId = parseInt(req.params.id);
  const { first_name, last_name, email, username } = req.body;
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Staff not found" });
    }
    const updated = await Staff.updateStaff(
      staffId,
      first_name,
      last_name,
      email,
      username,
    );
    if (!updated) {
      return res
        .status(500)
        .json({ success: false, code: 500, message: "Failed to update staff" });
    }
    const updatedStaff = await Staff.findById(staffId);
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Staff updated successfully",
      staff: updatedStaff,
    });
  } catch (error) {
    console.log("Error updating staff:", error.message);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.getMyProfile = async (req, res) => {
  const staffId = req.user.id;
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Staff not found" });
    }
    staff.password = undefined;
    return res.status(200).json({ success: true, code: 200, staff });
  } catch (error) {
    console.log("Error fetching staff profile:", error.message);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.changeMyPassword = async (req, res) => {
  const staffId = req.user.id;
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({
      success: false,
      code: 400,
      message: "Old and new passwords are required",
    });
  }
  try {
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Staff not found" });
    }
    const isMatch = await bcrypt.compare(old_password, staff.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "Old password is incorrect",
      });
    }
    const hashedPassword = await bcrypt.hash(new_password, 10);
    const updated = await Staff.updatePassword(staffId, hashedPassword);
    if (!updated) {
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Failed to update password",
      });
    }
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log("Error changing password:", error.message);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};
