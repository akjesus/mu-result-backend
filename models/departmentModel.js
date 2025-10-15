const db = require("../config/database");

class Department {
  static async findById(id) {
    const [rows] = await db.query("SELECT * FROM departments WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  }
    static async getAllDepartments() {
    const [result ] = await db.query(`
        SELECT  departments.id, departments.name, departments.faculty_id as school_id,
        faculties.name AS school
        FROM departments
        JOIN faculties ON departments.faculty_id = faculties.id
        ORDER BY name ASC
    `);
    return result;
  }
    static async createDepartment(name, faculty_id) {
    const [result] = await db.query(
      `INSERT INTO departments 
      (name, faculty_id, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())`,
        [name, faculty_id]
    );
    return result.insertId;
  }
    static async updateDepartment(departmentId, name, faculty_id) {
    const [result] = await db.query(
      `UPDATE departments 
       SET name = ?  faculty_id = ? WHERE id = ?`,
            [name, faculty_id, departmentId]
    );
    return result.affectedRows > 0;
  }
    static async deleteDepartment(departmentId) {
    const [result] = await db.query("DELETE FROM departments WHERE id = ?", [departmentId]);
    return result.affectedRows > 0;
  }
}

module.exports = Department;