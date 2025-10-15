const db = require("../config/database");

class Course {
  static async findById(id) {
    const [rows] = await db.query("SELECT * FROM courses WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  }
    static async createCourse(
            name,
            code, 
            department_id, 
            level_id,
            semester_id,
            credit_load,
            active,
    ) {
    const [result] = await db.query(
      `INSERT INTO courses 
      (name, code, department_id, level_id, semester_id, credit_load, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [   name,
            code, 
            department_id, 
            level_id,
            semester_id,
            credit_load,
            active]
    );
    return result.insertId;
  }
    static async getAllCourses(limit, offset) {
    const [result ] = await db.query(`
        SELECT *
        FROM courses
        LIMIT ?
        OFFSET ?
    `, [limit, offset]);
    return result;
  } 
    static async updateCourse(
            courseId, 
            department_id, 
            level_id,
            semester_id,
            name,
            code, 
            credit_load) 
            {
    const [result] = await db.query(
      `UPDATE courses 
       SET name = ?, code = ?, department_id = ?, level_id = ?, 
       semester_id = ?, credit_load = ? WHERE id = ?`,
            [
            name,
            code, 
            department_id, 
            level_id,
            semester_id,
            credit_load,
            courseId]
    );
    return result.affectedRows > 0;
  }
    static async deleteCourse(id) {
    const [result] = await db.query(
      `DELETE FROM courses WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
module.exports = Course;