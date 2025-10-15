//import db 
const db = require("../config/database");


class Report {
    static async getStudentResultsbyGrade(grade) {
        const [rows] = await db.query("SELECT * FROM results WHERE grade = ?", [grade]);
        return rows;
    }
//get number of students by grade distribution for a course 
    static async getGradeDistributionByCourse(courseId) {
        const [rows] = await db.query(`
        SELECT grade, COUNT(*) as count
        FROM results
        WHERE course_id = ?
        GROUP BY grade
        ORDER BY FIELD(grade, 'A', 'B', 'C', 'D', 'E', 'F')`, [courseId]);
        return rows;
    }
//get number of students by grade distribution for a level in a semester and session
    static async getGradeDistributionByLevel(levelId, semesterId, sessionId) {
        const [rows] = await db.query(`
        SELECT r.grade, COUNT(*) as count
        FROM results r
        JOIN courses c ON r.course_id = c.id
        WHERE c.level_id = ? AND r.semester_id = ? AND r.session_id = ?
        GROUP BY r.grade
        ORDER BY FIELD(r.grade, 'A', 'B', 'C', 'D', 'E', 'F')`, [levelId, semesterId, sessionId]);
        return rows;
    }
//get number of students by grade distribution for a department in a semester and session
    static async getGradeDistributionByDepartment(departmentId, semesterId, sessionId) {
        const [rows] = await db.query(`
        SELECT r.grade, COUNT(*) as count
        FROM results r
        JOIN courses c ON r.course_id = c.id
        WHERE c.department_id = ? AND r.semester_id = ? AND r.session_id = ?
        GROUP BY r.grade
        ORDER BY FIELD(r.grade, 'A', 'B', 'C', 'D', 'E', 'F')`, [departmentId, semesterId, sessionId]);
        return rows;
    }
//get number of students by grade distribution for a faculty in a semester and session
    static async getGradeDistributionByFaculty(facultyId, semesterId, sessionId) {  
        const [rows] = await db.query(`
        SELECT r.grade, COUNT(*) as count
        FROM results r
        JOIN courses c ON r.course_id = c.id
        JOIN departments d ON c.department_id = d.id
        WHERE d.faculty_id = ? AND r.semester_id = ? AND r.session_id = ?
        GROUP BY r.grade
        ORDER BY FIELD(r.grade, 'A', 'B', 'C', 'D', 'E', 'F')`, [facultyId, semesterId, sessionId]);
        return rows;
    };
//get number of students by grade distribution for the entire school in a semester and session
    static async getGradeDistributionBySchool(semesterId, sessionId) {  
        const [rows] = await db.query(`
        SELECT r.grade, COUNT(*) as count
        FROM results r
        WHERE r.semester_id = ? AND r.session_id = ?
        GROUP BY r.grade
        ORDER BY FIELD(r.grade, 'A', 'B', 'C', 'D', 'E', 'F')`, [semesterId, sessionId]);
        return rows;
    }
}

module.exports = Report;