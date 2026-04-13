const Department = require("../models/departmentModel");
const Faculty = require("../models/facultyModel");
const db = require("../config/database");
const Session = require("../models/sessionsModel");
const Level = require("../models/levelModel");
const Semester = require("../models/semestersModel");

// Get all departments
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.getAllDepartments();
    return res.status(200).json({ success: true, code: 200, departments });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.getAllFaculties();
    return res
      .status(200)
      .json({ success: true, code: 200, schools: faculties });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.createFaculty = async (req, res) => {
  const { name } = req.body;
  try {
    const faculty = await Faculty.createFaculty(name);
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Faculty Created Successfully!",
      faculty,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  const { id } = req.params;
  try {
    const faculty = await Faculty.deleteFaculty(id);
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Faculty deleted Successfully!",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.updateFaculty = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    await Faculty.updateFaculty(id, name);
    return res.status(200).json({
      success: true,
      code: 200,
      message: "Faculty updated Successfully!",
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};
// Get a single department by ID
exports.getDepartmentById = async (req, res) => {
  const departmentId = parseInt(req.params.id);
  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Department not found" });
    }
    return res.status(200).json({ success: true, code: 200, department });
  } catch (error) {
    console.log("Error fetching department by ID:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.getFacultyById = async (req, res) => {
  const facultyId = parseInt(req.params.id);
  try {
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Faculty not found" });
    }
    return res.status(200).json({ success: true, code: 200, faculty });
  } catch (error) {
    console.log("Error fetching faculty by ID:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};
// Create a new department
exports.createDepartment = async (req, res) => {
  try {
    const { name, faculty_id } = req.body;
    if (!name || !faculty_id) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "Department / Faculty name is required",
      });
    }
    const departmentId = await Department.createDepartment(name, faculty_id);
    const newDepartment = await Department.findById(departmentId);
    return res.status(201).json({
      success: true,
      code: 201,
      message: "Department created successfully",
      department: newDepartment,
    });
  } catch (error) {
    console.log("Error creating department:", error.message);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};
// Update an existing department
exports.updateDepartment = async (req, res) => {
  const departmentId = parseInt(req.params.id);
  const { name, faculty_id } = req.body;
  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Department not found" });
    }
    if (!name || !faculty_id) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "Department / Faculty name is required",
      });
    }
    const updated = await Department.updateDepartment(
      departmentId,
      name,
      faculty_id,
    );
    if (updated) {
      const updatedDepartment = await Department.findById(departmentId);
      return res.status(200).json({
        success: true,
        code: 200,
        message: "Department updated successfully",
        department: updatedDepartment,
      });
    } else {
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Failed to update department",
      });
    }
  } catch (error) {
    console.log("Error updating department:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};
// Delete a department
exports.deleteDepartment = async (req, res) => {
  const departmentId = parseInt(req.params.id);
  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Department not found" });
    }
    const deleted = await Department.deleteDepartment(departmentId);
    if (deleted) {
      return res.status(200).json({
        success: true,
        code: 200,
        message: "Department deleted successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Failed to delete department",
      });
    }
  } catch (error) {
    console.log("Error deleting department:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.getAllSessions();
    if (!sessions) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "No sessions found" });
    }
    return res.status(200).json({ success: true, code: 200, sessions });
  } catch (error) {
    console.log("Error fetching sessions:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.getLevels = async (req, res) => {
  try {
    const levels = await Level.getAllLevels();
    if (!levels) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "No levels found" });
    }
    return res.status(200).json({ success: true, code: 200, levels });
  } catch (error) {
    console.log("Error fetching levels:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.getSessions();
    return res.status(200).json({ success: true, code: 200, sessions });
  } catch (error) {
    console.log("Error fetching all sessions:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.createSession = async (req, res) => {
  const { name, start_date, end_date } = req.body;
  try {
    const sessionId = await Session.createSession(name, start_date, end_date);
    return res.status(201).json({
      success: true,
      code: 201,
      message: "Session created successfully",
      sessionId,
    });
  } catch (error) {
    console.log("Error creating session:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.updateSession = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { name, start_date, end_date } = req.body;
  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Session not found" });
    }
    const updated = await Session.updateSession(
      sessionId,
      name,
      start_date,
      end_date,
    );
    if (updated) {
      return res.status(200).json({
        success: true,
        code: 200,
        message: "Session updated successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Failed to update session",
      });
    }
  } catch (error) {
    console.log("Error updating session:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Session not found" });
    }
    const deleted = await Session.deleteSession(sessionId);
    if (deleted) {
      return res.status(200).json({
        success: true,
        code: 200,
        message: "Session deleted successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Failed to delete session",
      });
    }
  } catch (error) {
    console.log("Error deleting session:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.getAllSemestersWithSessions = async (req, res) => {
  try {
    const semesters = await Semester.getAllSemestersWithSessions();
    const sessions = semesters
      .map((semester, index) => {
        return {
          id: index,
          session_id: semester.session_id,
          session_name: semester.session_name,
        };
      })
      .flat();
    return res.status(200).json({ success: true, semesters, sessions });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteSemester = async (req, res) => {
  const semesterId = parseInt(req.params.id);
  try {
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Semester not found" });
    }
    const deleted = await Semester.deleteSemester(semesterId);
    if (deleted) {
      return res.status(200).json({
        success: true,
        code: 200,
        message: "Semester deleted successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Failed to delete semester",
      });
    }
  } catch (error) {
    console.log("Error deleting semester:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};
exports.getSemestersForSession = async (req, res) => {
  const sessionId = parseInt(req.params.id);
  try {
    const semesters = await Session.getSemestersForSession(sessionId);
    if (!semesters) {
      console.log("No semesters found for session ID:", sessionId);
      return res.status(404).json({
        success: false,
        code: 404,
        message: "No semesters found for this session",
      });
    }
    return res.status(200).json({ success: true, code: 200, semesters });
  } catch (error) {
    console.log("Error fetching semesters for session:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.activateSemester = async (req, res) => {
  const semesterId = parseInt(req.params.id);
  try {
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Semester not found" });
    }
    const activated = await Semester.activateSemester(semesterId);
    if (activated) {
      return res.status(200).json({
        success: true,
        code: 200,
        message: "Semester activated successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        code: 500,
        message: "Failed to activate semester",
      });
    }
  } catch (error) {
    console.log("Error activating semester:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};

exports.createSemester = async (req, res) => {
  const { name, session_id } = req.body;
  try {
    const session = await Session.findById(session_id);
    if (!session) {
      return res
        .status(404)
        .json({ success: false, code: 404, message: "Session not found" });
    }
    const [existingSemester] = await db.query(
      "SELECT * FROM semesters WHERE name = ? AND session_id = ?",
      [name, session_id]
    );
    if (existingSemester.length > 0) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "Semester with this name already exists for the selected session",
      });
    }
    const semester = await Semester.createSemester(name, session_id);
    if (semester)
      return res.status(201).json({
        success: true,
        code: 201,
        message: "Semester created Successfully!",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 500,
      error: error.message,
    });
  }
};

exports.getAllSemesters = async (req, res) => {
  try {
    const semesters = await Semester.getAllSemesters();
    return res.status(200).json({ success: true, code: 200, semesters });
  } catch (error) {
    console.log("Error fetching all semesters:", error);
    return res
      .status(500)
      .json({ success: false, code: 500, message: error.message });
  }
};
