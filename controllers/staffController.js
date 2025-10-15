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
            return res.status(404).json({ success: false, code: 404, message: 'Staff not found' });
        }
        return res.status(200).json({ success: true, code: 200, staff });
    }
    catch (error) {
        console.log('Error fetching staff by ID:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }

};  

exports.deleteStaff = async (req, res) => {
    const staffId = parseInt(req.params.id);
    try {
        const deleted = await Staff.deleteStaff(staffId);
        if (!deleted) {
            return res.status(404).json({ success: false, code: 404, message: 'Staff not found or already deleted' });
        }
        return res.status(200).json({ success: true, code: 200, message: 'Staff deleted successfully' });
    } catch (error) {
        console.log('Error deleting staff:', error);
        return res.status(500).json({ success: false, code: 500, message: error });
    }
};

exports.resetPassword = async (req, res) => {
    const staffId = parseInt(req.params.id); 
    try {
        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ success: false, code: 404, message: 'Staff not found' });
        }
        const hashedPassword = await bcrypt.hash("staff1234", 10);
        const updated = await Staff.updatePassword(staffId, hashedPassword);
        if (!updated) {
            return res.status(500).json({ success: false, code: 500, message: 'Failed to update password' });
        }
        return res.status(200).json({ success: true, code: 200, message: 'Password updated successfully' });
    }
    catch (error) {
        console.log('Error resetting password:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

exports.createStaff = async (req, res) => {
    const { first_name, last_name, email, username } = req.body;
    if( !first_name || !last_name || !email || !username ) {
        return res.status(400).json({ success: false, code: 400, message: 'All fields are required' });
    }
 
    try {
        const existingUser = await Staff.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ success: false, code: 400, message: 'Username or email already exists' });
        }
        const staffId = await Staff.createStaff(first_name, last_name, email, username);
        const newStaff = await Staff.findById(staffId);
        return res.status(201).json({ success: true, code: 201, message: 'Staff created successfully', staff: newStaff });
    } catch (error) {
        console.log('Error creating staff:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};


exports.updateStaff = async (req, res) => {
    const staffId = parseInt(req.params.id);
    const { first_name, last_name, email, username } = req.body;    
    try {
        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ success: false, code: 404, message: 'Staff not found' });
        }
        const updated = await Staff.updateStaff(staffId, first_name, last_name, email, username);
        if (!updated) {
            return res.status(500).json({ success: false, code: 500, message: 'Failed to update staff' });
        }
        const updatedStaff = await Staff.findById(staffId);
        return res.status(200).json({ success: true, code: 200, message: 'Staff updated successfully', staff: updatedStaff });
    } catch (error) {
        console.log('Error updating staff:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
