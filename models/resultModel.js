const db = require("../config/database");


class Result {
  // Calculate grade based on 5 Point GPA System
  static calculateGrade(totalScore) {
    if (totalScore >= 70) return 'A'; // 5.0
    if (totalScore >= 60) return 'B'; // 4.0
    if (totalScore >= 50) return 'C'; // 3.0
    if (totalScore >= 45) return 'D'; // 2.0
    if (totalScore >= 40) return 'E'; // 1.0
    return 'F'; // 0.0
  }
  static async findByStudentAndCourse(mat_no, course_id) {
    return db.query("SELECT * FROM results WHERE mat_no = ? AND course_id = ?", [mat_no, course_id]);
  }
  static async execute(query, params) {
      return db.query(query, params);
    }
  static async findById(id) {
    const [rows] = await db.query("SELECT * FROM results WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  }
  
  static async createResult(mat_no, course_id, first_quiz, second_quiz, exam_score, session_id, semester_id) {
      const totalScore = Number(first_quiz) + Number(second_quiz) + Number(exam_score);
      const grade = Result.calculateGrade(totalScore);
      try {
        const [result] = await db.query(
          `INSERT INTO results
          (mat_no, course_id, first_quiz, second_quiz, exam_score, session_id, semester_id, grade, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [mat_no, course_id, first_quiz, second_quiz, exam_score, session_id, semester_id, grade]
      );
      return result.insertId;
      }
      catch(error) {
        console.log("Error creating result:", error); 
          return error;
       }

      
    }
    
  static async getResultsByStudentId(mat_no) {
    const [rows] = await db.query("SELECT * FROM results WHERE mat_no = ?", [mat_no]);
    return rows;
  }

  static async updateResult(first_quiz, second_quiz, exam_score, grade, id) {
    const [result] = await db.query(
      `UPDATE results 
       SET first_quiz = ?, second_quiz = ?, exam_score = ?, grade = ?
       WHERE id = ?`,    
            [first_quiz, second_quiz, exam_score, grade, id]
    );
    return result.affectedRows > 0;
  }

  static async deleteResult(resultId) {
    const [result] = await db.query("DELETE FROM results WHERE id = ?", [resultId]);
    return result.affectedRows > 0;
  }
  static async getResultsByCourseId(courseId) {
    const [rows] = await db.query("SELECT * FROM results WHERE course_id = ?", [courseId]);
    return rows;
  }
  static async getResultByDepartment(departmentId) {
    const [rows] = await db.query(`
      SELECT r.*
      FROM results r    
        JOIN courses c ON r.course_id = c.id
        WHERE c.department_id = ?`, [departmentId]);
    return rows;
    }
//get result by student matching course id to course table
  static async getResultsByStudentAndCourse(studentId, courseId) {
    const [rows] = await db.query("SELECT * FROM results WHERE student_id = ? AND course_id = ?", [studentId, courseId]);
    return rows;
  }

  //bulk upload results by course id
  static async bulkUploadResults(results) {
      const values = results.map(result => {
        const totalScore = Number(result.first_quiz) + Number(result.second_quiz) + Number(result.exam_score);
        const grade = Result.calculateGrade(totalScore);
        return [
          result.mat_no,
          result.course_id,
          result.first_quiz,
          result.second_quiz,
          result.exam_score,
          result.semester_id,
          result.session_id,
          grade,
          new Date(),
          new Date()
        ];
      });
      try {
        const [res] = await db.query(
        `INSERT INTO results 
        (mat_no, course_id, first_quiz, second_quiz, exam_score, semester_id, session_id, grade, created_at, updated_at)  
           VALUES ?`,
          [values]
      );
      return res.affectedRows;
      }
      catch (error) {
        console.log("Error during bulk upload:", error);
        return 0;
      }
      
    }
  static async blockUnblockResult(mat_no) {
        const [result] = await db.query(
          `UPDATE results SET blocked = NOT blocked WHERE id = ?`,
          [mat_no]  
        );
        return result.affectedRows > 0;
      }
//function to calculate CGPA for all students
  static async calculateCGPA(mat_no) {
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
      WHERE r.mat_no = ?
      GROUP BY r.mat_no
    `, [mat_no]);
    return rows.length ? rows[0] : null;
  }
  //function to calculate average CGPA for all students in a department
  static async calculateAverageCGPAByDepartment(departmentId) {
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
        WHERE c.department_id = ?
        GROUP BY r.mat_no
      ) AS sub
    `, [departmentId]);
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
        GROUP BY r.mat_no
      ) AS sub
    `);
    return rows.length ? rows[0].average_cgpa : null;
  }
  //calculate current GPA for a student in the latest semester
  static async calculateCurrentGPA(mat_no, semester_id) {
    // Get GPA performance by semester
    const [performanceRows] = await db.query(`
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
    `, [mat_no]);

  // Get total courses taken (all semesters)
  const [allCoursesRows] = await db.query(`SELECT id FROM results WHERE mat_no = ?`, [mat_no]);
  const totalCourses = allCoursesRows.length;

  // Get total courses failed (current semester)
  const [failedCoursesRows] = await db.query(`SELECT id FROM results WHERE mat_no = ? AND semester_id = ? AND grade = 'F'`, [mat_no, semester_id]);
  const totalFailed = failedCoursesRows.length;
    // Calculate GPA for the semester
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
        ) / SUM(c.credit_load)) AS gpa
      FROM results r
      JOIN courses c ON r.course_id = c.id
      WHERE r.mat_no = ? AND r.semester_id = ?
    `, [mat_no, semester_id]);

    // Calculate CGPA for the student (all semesters)
    const [cgpaRows] = await db.query(`
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
    `, [mat_no]);

    // Always return CGPA, total courses, and performance, even if no results in active semester
    return {
      gpa: rows.length && rows[0].total_credit_hours > 0 ? rows[0].gpa : null,
      cgpa: cgpaRows.length && cgpaRows[0].total_credit_hours > 0 ? cgpaRows[0].cgpa : null,
      total_courses: totalCourses,
      total_failed: totalFailed,
      performance: performanceRows.map(row => ({
        semester: `${row.level_name} ${row.semester_name}`,
        gpa: row.gpa
      }))
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
      ORDER BY c.code ASC
    `);
    return rows;
  }
}
module.exports = Result;