const Course = require('../models/courseModel');
const db = require("../config/database");

// Get all courses with pagination
exports.getAllCourses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;   
    const limit = parseInt(req.query.limit) || null;
    const offset = (page - 1) * limit;
    let query = `SELECT courses.id as id, courses.name as title, courses.code, courses.credit_load as credit,
            IF(courses.active, 'Yes', 'No') AS active,
            departments.name AS departments, levels.name AS level, semesters.name AS semester
            FROM courses
            JOIN departments ON courses.department_id = departments.id
            JOIN levels ON courses.level_id = levels.id
            JOIN semesters ON courses.semester_id = semesters.id
            ORDER BY courses.code ASC`
    try {
        if(limit) query += " LIMIT ? OFFSET ?"
        const [courses] = await db.query(query, [limit, offset]);
        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM courses');
        return res.status(200).json({success: true, code: 200,
            courses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

// Get a single course by ID
exports.getCourseById = async (req, res) => {
    const courseId = parseInt(req.params.id);
    try {
        const [courses] = await db.query(`
            SELECT courses.name, courses.code, courses.credit_load,  courses.created_at,
            courses.updated_at, departments.name AS department, levels.name AS level, semesters.name AS semester,
            IF(courses.active, 'true', 'false') AS active
            FROM courses
            JOIN departments ON courses.department_id = departments.id
            JOIN levels ON courses.level_id = levels.id
            JOIN semesters ON courses.semester_id = semesters.id
            WHERE courses.id = ?
        `, [courseId]);
        if (!courses || courses.length === 0) {
            return res.status(404).json({ success: false, code: 404, message: 'Course not found' });
        }
        return res.status(200).json({success: true, code: 200, course: courses[0]});
    } catch (error) {
        console.log('Error fetching course by ID:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
// Create a new course
exports.createCourse = async (req, res) => {
    const { 
            name,
            code, 
            department_id, 
            level_id,
            semester_id,
            credit_load,
            active } = req.body;
    try {
        if (!name || !code || !department_id || !level_id || !semester_id || !credit_load || !active) {
            return res.status(400).json({ success: false, code: 400, message: 'All fields are required' });
        }
        const newCourseId = await Course.createCourse(
            name,
            code, 
            department_id, 
            level_id,
            semester_id,
            credit_load,
            active );
        // Fetch the newly created course with joined fields
        const [courses] = await db.query(`
            SELECT courses.name, courses.code, courses.credit_load,  courses.created_at,
            courses.updated_at, departments.name AS department, levels.name AS level, semesters.name AS semester
            FROM courses
            JOIN departments ON courses.department_id = departments.id
            JOIN levels ON courses.level_id = levels.id
            JOIN semesters ON courses.semester_id = semesters.id
            WHERE courses.id = ?
        `, [newCourseId]);
        return res.status(201).json({ success: true, code: 201, message: 'Course created successfully', course: courses[0] });
    } catch (error) {
        console.log('Error creating course:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
   
};
// Update an existing course
exports.updateCourse = async (req, res) => {
    const courseId = parseInt(req.params.id);
    const { department_id, 
            level_id,
            semester_id,
            name,
            code, 
            credit_load} = req.body;
    try {
        const [courses] = await db.query(`SELECT * FROM courses WHERE id = ?`, [courseId]);
        if (!courses || courses.length === 0) {
            return res.status(404).json({ success: false, code: 404, message: 'Course not found' });
        }
        const updated = await Course.updateCourse(
            courseId, 
            department_id, 
            level_id,
            semester_id,
            name,
            code, 
            credit_load);
        if (!updated) {
            return res.status(500).json({ success: false, code: 500, message: 'Failed to update course' });
        }
        // Fetch the updated course with joined fields
        const [updatedCourses] = await db.query(`
            SELECT courses.*, departments.name AS department_name, levels.name AS level_name, semesters.name AS semester_name
            FROM courses
            JOIN departments ON courses.department_id = departments.id
            JOIN levels ON courses.level_id = levels.id
            JOIN semesters ON courses.semester_id = semesters.id
            WHERE courses.id = ?
        `, [courseId]);
        return res.status(200).json({ success: true, code: 200, message: 'Course updated successfully', course: updatedCourses[0] });
    } catch (error) {
        console.log('Error updating course:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
// Delete a course
exports.deleteCourse = async (req, res) => {
    const courseId = parseInt(req.params.id);
    try {
        const [courses] = await db.query(`
            SELECT * from courses WHERE courses.id = ?`, [courseId]);
        if (!courses || courses.length === 0) {
            return res.status(404).json({ success: false, code: 404, message: 'Course not found' });
        }
        const deleted = await Course.deleteCourse(courseId);
        if (!deleted) {
            return res.status(500).json({ success: false, code: 500, message: 'Failed to delete course' });
        }
        return res.status(200).json({ success: true, code: 200, message: 'Course deleted successfully', course: courses[0] });
    } catch (error) {
        console.log('Error deleting course:', error);
        return res.status(500).json({ success: false, code: 500, message: error });
    }
};


exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Course.getAllDepartments();
        return res.status(200).json({ success: true, code: 200, departments });
    } catch (error) {
        console.log('Error fetching departments:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
