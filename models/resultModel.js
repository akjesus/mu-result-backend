const db = require("../config/database");

class Result {
  // Calculate grade based on 5 Point GPA System
  static calculateGrade(totalScore) {
    if (totalScore >= 70) return "A"; // 5.0
    if (totalScore >= 60) return "B"; // 4.0
    if (totalScore >= 50) return "C"; // 3.0
    if (totalScore >= 45) return "D"; // 2.0
    if (totalScore >= 40) return "E"; // 1.0
    return "F"; // 0.0
  }
  static async findByStudentAndCourse(mat_no, course_id) {
    return db.query(
      "SELECT * FROM results WHERE mat_no = ? AND course_id = ?",
      [mat_no, course_id],
    );
  }
  static async execute(query, params) {
    return db.query(query, params);
  }
  static async findById(id) {
    const [rows] = await db.query("SELECT * FROM results WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  }

  static async createResult(
    mat_no,
    course_id,
    cat,
    mid_term,
    exam_score,
    session_id,
    semester_id,
    created_by,
  ) {
    const totalScore = Number(cat) + Number(mid_term) + Number(exam_score);
    const grade = Result.calculateGrade(totalScore);
    try {
      const [result] = await db.query(
        `INSERT INTO results
          (mat_no, course_id, cat, mid_term, exam_score, session_id, semester_id, grade, created_at, updated_at, created_by, is_deleted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
        [
          mat_no,
          course_id,
          cat,
          mid_term,
          exam_score,
          session_id,
          semester_id,
          grade,
          created_by,
          0,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.log("Error creating result:", error);
      return error;
    }
  }

  static async getResultsByStudentId(mat_no) {
    const [rows] = await db.query("SELECT * FROM results WHERE mat_no = ?", [
      mat_no,
    ]);
    return rows;
  }

  static async updateResult(cat, mid_term, exam_score, grade, updated_by, id) {
    const [result] = await db.query(
      `UPDATE results 
       SET cat = ?, mid_term = ?, exam_score = ?, grade = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [cat, mid_term, exam_score, grade, updated_by, id],
    );
    return result.affectedRows > 0;
  }

  static async deleteResult(deleted_by, resultId) {
    const [result] = await db.query(
      "UPDATE results SET is_deleted = 1, deleted_by = ?, deleted_at = NOW() WHERE id = ?",
      [deleted_by, resultId],
    );
    return result.affectedRows > 0;
  }
  static async getResultsByCourseId(courseId) {
    const [rows] = await db.query("SELECT * FROM results WHERE course_id = ?", [
      courseId,
    ]);
    return rows;
  }
  static async getResultByDepartment(departmentId) {
    const [rows] = await db.query(
      `
      SELECT r.*
      FROM results r    
        JOIN courses c ON r.course_id = c.id
        WHERE c.department_id = ?`,
      [departmentId],
    );
    return rows;
  }
  //get result by student matching course id to course table
  static async getResultsByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.query(
      "SELECT * FROM results WHERE student_id = ? AND course_id = ?",
      [studentId, courseId],
    );
    return rows;
  }

  static async approveResult(session_id, semester_id, department_id, level_id) {
    const [semester] = await db.query(
      `
      SELECT * FROM semesters 
      WHERE id = ?
      LIMIT 1`,
      [semester_id],
    );
    const semId = semester[0].name === "First" ? 1 : 2;
    const [courseRows] = await db.query(
      `
      SELECT DISTINCT c.id, c.name, c.code
      FROM courses c 
      where c.level_id = ? 
      AND c.department_id = ? 
      AND c.semester_id = ?`,
      [level_id, department_id, semId],
    );
    const courseIds = courseRows.map((row) => row.id);
    const courses = courseRows.map((row) => `${row.code}: ${row.name}`);
    if (courseIds.length === 0) {
      console.log("No courses found for the specified criteria.");
      return false;
    }
    const [approved] = await db.query(
      `update results set approved = 1 where course_id IN (?) AND session_id = ?`,
      [courseIds, session_id],
    );

    if (approved.affectedRows > 0) return courses;
    else return false;
  }

  static async approveCourseResult(session_id, courses_id) {
    const [approved] = await db.query(
      `UPDATE results 
                   SET approved = 1 
                   WHERE session_id = ? 
                   AND course_id IN (?)`,
      [session_id, courses_id],
    );

    try {
      return approved;
    } catch (error) {
      console.log("Error in approveCourseResult:", error);
      return false;
    }
  }

  //bulk upload results by course id
  static async bulkUploadResults(results) {
    const values = results.map((result) => {
      const totalScore =
        Number(result.cat) +
        Number(result.mid_term) +
        Number(result.exam_score);
      const grade = Result.calculateGrade(totalScore);
      return [
        result.mat_no,
        result.course_id,
        result.cat,
        result.mid_term,
        result.exam_score,
        result.semester_id,
        result.session_id,
        grade,
        result.created_by,
        new Date(),
        new Date(),
      ];
    });
    try {
      const [res] = await db.query(
        `INSERT INTO results 
        (mat_no, course_id, cat, mid_term, exam_score, semester_id, session_id, grade, created_by, created_at, updated_at)  
           VALUES ?`,
        [values],
      );
      return res.affectedRows;
    } catch (error) {
      console.log("Error during bulk upload:", error);
      return 0;
    }
  }
  static async blockUnblockResult(mat_no) {
    const [result] = await db.query(
      `UPDATE results SET approved = NOT approved WHERE id = ?`,
      [mat_no],
    );
    return result.affectedRows > 0;
  }
  //function to calculate CGPA for all students
  static async calculateCGPA(mat_no) {
    const [rows] = await db.query(
      `
      SELECT
        r.mat_no,
        SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0 
            ELSE 0.0
          END * c.credit_load
        ) AS total_quality_points,
        SUM(c.credit_load) AS total_credit_hours,
        (SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) / SUM(c.credit_load)) AS cgpa
      FROM results r
      JOIN courses c ON r.course_id = c.id
      WHERE r.mat_no = ?
      AND r.is_deleted = 0
      GROUP BY r.mat_no
    `,
      [mat_no],
    );
    return rows.length ? rows[0] : null;
  }
  //function to calculate average CGPA for all students in a department
  static async calculateAverageCGPAByDepartment(departmentId) {
    const [rows] = await db.query(
      `
      SELECT
        AVG(sub.cgpa) AS average_cgpa
      FROM (
        SELECT
          r.mat_no,
          (SUM(
            CASE r.grade
              WHEN 'A' THEN 5.0
              WHEN 'B' THEN 4.0
              WHEN 'C' THEN 3.0
              WHEN 'D' THEN 2.0
              WHEN 'E' THEN 1.0
              WHEN 'F' THEN 0.0
              ELSE 0.0
            END * c.credit_load
          ) / SUM(c.credit_load)) AS cgpa
        FROM results r
        JOIN courses c ON r.course_id = c.id
        WHERE c.department_id = ?
        AND r.is_deleted = 0
        GROUP BY r.mat_no
      ) AS sub
    `,
      [departmentId],
    );
    return rows.length ? rows[0].average_cgpa : null;
  }

  static async calculateAllCGPA() {
    const [rows] = await db.query(`
      SELECT
        r.mat_no,
        SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) AS total_quality_points,
        SUM(c.credit_load) AS total_credit_hours,
        (SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) / SUM(c.credit_load)) AS cgpa
      FROM results r
      JOIN courses c ON r.course_id = c.id
      WHERE r.is_deleted = 0
      GROUP BY r.mat_no
    `);
    return rows;
  }

  static async getHighestandLowestCGPA() {
    const [rows] = await db.query(`
      SELECT
        r.mat_no, s.first_name, s.last_name, d.name AS department,
        (SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) / SUM(c.credit_load)) AS cgpa
      FROM results r
      JOIN students s ON r.mat_no = s.mat_no
      JOIN departments d ON s.department_id = d.id
      JOIN courses c ON r.course_id = c.id
      WHERE r.is_deleted = 0
      GROUP BY r.mat_no, s.first_name, s.last_name, department
      ORDER BY cgpa DESC
      LIMIT 1
    `);
    const highestCGPA = rows.length ? rows[0] : null;
    const [lowRows] = await db.query(`
      SELECT
        r.mat_no,  s.first_name, s.last_name, d.name AS department,
        (SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) / SUM(c.credit_load)) AS cgpa
      FROM results r
      JOIN students s ON r.mat_no = s.mat_no
      JOIN departments d ON s.department_id = d.id
      JOIN courses c ON r.course_id = c.id
      WHERE r.is_deleted = 0
      GROUP BY r.mat_no, s.first_name, s.last_name, department
      ORDER BY cgpa ASC
      LIMIT 1
    `);
    const lowestCGPA = lowRows.length ? lowRows[0] : null;
    return { highestCGPA, lowestCGPA };
  }
  static async averageCGPA() {
    const [rows] = await db.query(`
      SELECT
        AVG(sub.cgpa) AS average_cgpa
      FROM (
        SELECT
          r.mat_no,
          (SUM(
            CASE r.grade
              WHEN 'A' THEN 5.0
              WHEN 'B' THEN 4.0
              WHEN 'C' THEN 3.0
              WHEN 'D' THEN 2.0
              WHEN 'E' THEN 1.0
              WHEN 'F' THEN 0.0
              ELSE 0.0
            END * c.credit_load
          ) / SUM(c.credit_load)) AS cgpa
        FROM results r
        JOIN courses c ON r.course_id = c.id
        WHERE r.is_deleted = 0
        GROUP BY r.mat_no
      ) AS sub
    `);
    return rows.length ? rows[0].average_cgpa : null;
  }
  //calculate current GPA for a student in the latest semester
  static async calculateCurrentGPA(mat_no, semester_id) {
    // Get GPA performance by semester
    const [performanceRows] = await db.query(
      `
      SELECT s.name AS semester_name, l.name AS level_name, c.semester_id,
        (SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) / SUM(c.credit_load)) AS gpa
      FROM results r
      JOIN courses c ON r.course_id = c.id
      JOIN semesters s ON c.semester_id = s.id
      JOIN levels l ON c.level_id = l.id
      WHERE r.mat_no = ?
      GROUP BY c.semester_id, s.name, l.name
      ORDER BY c.semester_id ASC
    `,
      [mat_no],
    );

    // Get total courses taken (all semesters)
    const [allCoursesRows] = await db.query(
      `SELECT id FROM results WHERE mat_no = ? AND is_deleted = 0 AND approved = 1`,
      [mat_no],
    );
    const totalCourses = allCoursesRows.length;

    // Get total courses failed (current semester)
    const [failedCoursesRows] = await db.query(
      `SELECT id FROM results WHERE mat_no = ? AND semester_id = ? AND grade = 'F' AND is_deleted = 0 AND approved = 0`,
      [mat_no, semester_id],
    );
    const totalFailed = failedCoursesRows.length;
    // Calculate GPA for the semester
    const [rows] = await db.query(
      `
      SELECT
        r.mat_no,
        SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) AS total_quality_points,
        SUM(c.credit_load) AS total_credit_hours,
        (SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) / SUM(c.credit_load)) AS gpa
      FROM results r
      JOIN courses c ON r.course_id = c.id
      WHERE r.mat_no = ? AND r.semester_id = ? AND r.is_deleted = 0
    `,
      [mat_no, semester_id],
    );

    // Calculate CGPA for the student (all semesters)
    const [cgpaRows] = await db.query(
      `
      SELECT
        r.mat_no,
        SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) AS total_quality_points,
        SUM(c.credit_load) AS total_credit_hours,
        (SUM(
          CASE r.grade
            WHEN 'A' THEN 5.0
            WHEN 'B' THEN 4.0
            WHEN 'C' THEN 3.0
            WHEN 'D' THEN 2.0
            WHEN 'E' THEN 1.0
            WHEN 'F' THEN 0.0
            ELSE 0.0
          END * c.credit_load
        ) / SUM(c.credit_load)) AS cgpa
      FROM results r
      JOIN courses c ON r.course_id = c.id
      WHERE r.mat_no = ?
      AND r.is_deleted = 0
      GROUP BY r.mat_no
    `,
      [mat_no],
    );

    // Always return CGPA, total courses, and performance, even if no results in active semester
    return {
      gpa: rows.length && rows[0].total_credit_hours > 0 ? rows[0].gpa : null,
      cgpa:
        cgpaRows.length && cgpaRows[0].total_credit_hours > 0
          ? cgpaRows[0].cgpa
          : null,
      total_courses: totalCourses,
      total_failed: totalFailed,
      performance: performanceRows.map((row) => ({
        semester: `${row.level_name} ${row.semester_name}`,
        gpa: row.gpa,
      })),
    };
  }

  static async getCoursesWithResults() {
    const [rows] = await db.query(`
      SELECT DISTINCT c.id, c.name, c.code, c.credit_load,
        s.name AS session, sem.name AS semester
      FROM courses c
      JOIN results r ON c.id = r.course_id
      JOIN sessions s ON r.session_id = s.id
      JOIN semesters sem ON r.semester_id = sem.id
      WHERE r.is_deleted = 0
      ORDER BY c.code ASC
    `);
    return rows;
  }

  static async getResultsBySessionandSemester(session, semester) {
    const [rows] = await db.query(
      `
      SELECT DISTINCT c.id, c.name, c.code, r.approved,
      s.name AS session_name, sem.name AS semester_name,
      r.session_id
      FROM results r
      JOIN courses c ON r.course_id = c.id
      JOIN sessions s ON r.session_id = s.id
      JOIN semesters sem ON r.semester_id = sem.id
      WHERE r.session_id = ? AND r.semester_id = ? AND r.is_deleted = 0
    `,
      [session, semester],
    );
    return rows;
  }

  //toggle approval status of a course by id and session id
  static async toggleCourseApproval(session_id, course_id) {
    const [approved] = await db.query(
      `UPDATE results 
                   SET approved = NOT approved 
                   WHERE session_id = ? 
                   AND course_id = ?`,
      [session_id, course_id],
    );
    return approved;
  }
}
module.exports = Result;
