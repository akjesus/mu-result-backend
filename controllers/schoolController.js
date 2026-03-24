const Department = require("../models/departmentModel");
const Faculty = require("../models/facultyModel")
const db = require("../config/database");
const Session = require("../models/sessionsModel");
const Level = require("../models/levelModel")
const Semester = require("../models/semestersModel");

// Get all departments
exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.getAllDepartments();
        return res.status(200).json({ success: true, code: 200, departments });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }       
};

exports.getAllFaculties = async (req, res) => {
    try {
        const faculties = await Faculty.getAllFaculties();
        return res.status(200).json({ success: true, code: 200, schools: faculties });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }       
};

exports.createFaculty = async (req, res) => {
    const {name} = req.body
    try {
        const faculty = await Faculty.createFaculty(name);
        return res.status(200).json({ success: true, code: 200, message: "Faculty Created Successfully!", faculty});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
}

exports.deleteFaculty = async (req, res) => {
    const {id} = req.params
    try {
        const faculty = await Faculty.deleteFaculty(id);
        return res.status(200).json({ success: true, code: 200, message: "Faculty deleted Successfully!"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
}
// Get a single department by ID
exports.getDepartmentById = async (req, res) => {
    const departmentId = parseInt(req.params.id);
    try {
        const department = await Department.findById(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, code: 404, message: 'Department not found' });
        }
        return res.status(200).json({ success: true, code: 200, department });
    } catch (error) {
        console.log('Error fetching department by ID:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};


exports.getFacultyById = async (req, res) => {
    const facultyId = parseInt(req.params.id);
    try {
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({ success: false, code: 404, message: 'Faculty not found' });
        }
        return res.status(200).json({ success: true, code: 200, faculty });
    } catch (error) {
        console.log('Error fetching faculty by ID:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
// Create a new department
exports.createDepartment = async (req, res) => {
    try {
        const { name, faculty_id } = req.body;
        if (!name || !faculty_id) {
            return res.status(400).json({ success: false, code: 400, message: 'Department / Faculty name is required' });
        }
        const departmentId = await Department.createDepartment(name, faculty_id);
        const newDepartment = await Department.findById(departmentId);
        return res.status(201).json({ success: true, code: 201, message: 'Department created successfully', department: newDepartment });
    }
    catch (error) {
        console.log('Error creating department:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
// Update an existing department
exports.updateDepartment = async (req, res) => {
    const departmentId = parseInt(req.params.id);
    const { name, faculty_id } = req.body;
    try {
        const department = await Department.findById(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, code: 404, message: 'Department not found' });
        }
        if (!name || !faculty_id) {
            return res.status(400).json({ success: false, code: 400, message: 'Department / Faculty name is required' });
        }
        const updated = await Department.updateDepartment(departmentId, name, faculty_id);
        if (updated) {
            const updatedDepartment = await Department.findById(departmentId);
            return res.status(200).json({ success: true, code: 200, message: 'Department updated successfully', department: updatedDepartment });
        } else {
            return res.status(500).json({ success: false, code: 500, message: 'Failed to update department' });
        }
    } catch (error) {
        console.log('Error updating department:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
}
// Delete a department
exports.deleteDepartment = async (req, res) => {
    const departmentId = parseInt(req.params.id);
    try {
        const department = await Department.findById(departmentId);
        if (!department) {
            return res.status(404).json({ success: false, code: 404, message: 'Department not found' });
        }
        const deleted = await Department.deleteDepartment(departmentId);
        if (deleted) {
            return res.status(200).json({ success: true, code: 200, message: 'Department deleted successfully' });
        } else {
            return res.status(500).json({ success: false, code: 500, message: 'Failed to delete department' });
        }
    } catch (error) {
        console.log('Error deleting department:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};


exports.getSessions = async (req, res) => {
    try {
        const sessions = await Session.getAllSessions();
        if (!sessions) {
            return res.status(404).json({ success: false, code: 404, message: 'No sessions found' });
        }
        return res.status(200).json({ success: true, code: 200, sessions });
    } catch (error) {
        console.log('Error fetching sessions:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

exports.getLevels = async (req, res) => {
    try {
        const levels = await Level.getAllLevels();
        if (!levels) {
            return res.status(404).json({ success: false, code: 404, message: 'No levels found' });
        }
        return res.status(200).json({ success: true, code: 200, levels });
    } catch (error) {
        console.log('Error fetching levels:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

exports.getSemestersForSession = async (req, res) => {
    const sessionId = parseInt(req.params.id);
    console.log("Fetching semesters for session ID:", sessionId);
    try {
        const semesters = await Session.getSemestersForSession(sessionId);
        if (!semesters) {
            console.log('No semesters found for session ID:', sessionId);
            return res.status(404).json({ success: false, code: 404, message: 'No semesters found for this session' });
        }
        return res.status(200).json({ success: true, code: 200, semesters });
    } catch (error) {
        console.log('Error fetching semesters for session:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};


exports.activateSemester = async (req, res) => {
    const semesterId = parseInt(req.params.id);
    try {
        const semester = await Semester.findById(semesterId);
        if (!semester) {
            return res.status(404).json({ success: false, code: 404, message: 'Semester not found' });
        }
        const activated = await Semester.activateSemester(semesterId);
        if (activated) {
            return res.status(200).json({ success: true, code: 200, message: 'Semester activated successfully' });
        } else {
            return res.status(500).json({ success: false, code: 500, message: 'Failed to activate semester' });
        }
    } catch (error) {
        console.log('Error activating semester:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
