const db = require("../config/database");


class Student {
  static async execute(query, params) {
    return db.query(query, params);
  }
  static async findByUsername(username) {
    const [rows] = await db.query(
      `SELECT * FROM students WHERE LOWER(mat_no) = ? or email = ?`,
      [username.toLowerCase(), username]
    );
    return rows[0];
  }
  static async findById(id) {
     const [rows] = await db.query(`
      SELECT concat(first_name, ' ', last_name) as fullName, 
      email, username, mat_no as matric, phone,
      IF(blocked, 'true', 'false') AS blocked,
      departments.name as department, photo,
      levels.name as level,
      faculties.name as school
      FROM students 
      LEFT JOIN departments ON students.department_id = departments.id
      LEFT JOIN faculties ON departments.faculty_id = faculties.id
      LEFT JOIN levels ON students.level_id = levels.id
      WHERE students.id = ?`, [id]);
      return rows.length ? rows[0] : null;
  };
  static async findByIdPass(id) {
    const [rows] = await db.query(`
      SELECT students.id, concat(first_name, ' ', last_name) as fullName, 
      email, username, mat_no as matric, password,
      IF(blocked, 'true', 'false') AS blocked,
      departments.name as department,
      levels.name as level,
      faculties.name as school
      FROM students 
      LEFT JOIN departments ON students.department_id = departments.id
      LEFT JOIN faculties ON departments.faculty_id = faculties.id
      LEFT JOIN levels ON students.level_id = levels.id
      WHERE students.id = ?`, [id]);
      return rows.length ? rows[0] : null;

  }
    static async createStudent(department, level, first_name, last_name, email, matric, username, password) {
    const [result] = await db.query(
      `INSERT INTO students (department_id, level_id, first_name, last_name, email, mat_no, username, password, created_at, updated_at, role, blocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
      [department, level, first_name, last_name, email, matric, username, password, 'student', 0]
    );
    return result.insertId;
  }
  static async blockUnblockStudent(id, isBlocked) {
    console.log(id, isBlocked)
    const [result] = await db.query(
      `UPDATE students SET blocked = ? WHERE id = ?`,
      [isBlocked === true ? 1 : 0, id]
    );
    return result.affectedRows > 0;
  }
  static async changePassword(id, password) {
    const [result] = await db.query(
      `UPDATE students 
      SET password = ?, 
      updated_at = NOW(),
      resetCode = NULL, resetExpires = NULL
      WHERE id = ?`,  
      [password, id]
    );
    return result.affectedRows > 0;
  }
  static async resetPassword(id, code, expires) {
    const [result] = await db.query(`
      UPDATE students
      set resetCode = ?, resetExpires = ?
      where id = ?`, [code, expires, id]);
      return result.affectedRows > 0;
  }
  static async changePassword(user, password) {
    const [result] = await db.query(`
      UPDATE students
      set password = ?, resetCode = NULL, resetExpires = NULL
      where id = ?`, [password, user]);
      return result.affectedRows > 0;
  }
  static async blockStudent(mat_no) {
          const [result] = await db.query(
            `UPDATE students SET blocked = 1 WHERE mat_no = ?`,
            [mat_no]  
          );
          return result.affectedRows > 0;
        }
    static async findByResetCode(resetCode) {
        const [rows] = await db.query(
          `SELECT * FROM students WHERE resetCode = ?`,
          [resetCode]
        );
        return rows.length ? rows[0] : null;
      }
  static async resetAllPasswords(newPassword) {
    const [result] = await db.query(`
      UPDATE students
      set password = ?`, [newPassword]);
      return result.affectedRows;
  }
  static async findByMatNo(mat_no) {
    const [rows] = await db.query(
      `SELECT * FROM students WHERE LOWER(mat_no) = ?`,
      [mat_no.toLowerCase()]
    );
    return rows[0];
  } 
}
module.exports = Student;