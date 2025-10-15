const db = require("../config/database");


class Student {
  static async execute(query, params) {
    return db.query(query, params);
  }
  static async findByUsername(username) {
    const [rows] = await db.query(
      `SELECT * FROM students WHERE LOWER(registration_number) = ? or email = ?`,
      [username.toLowerCase(), username]
    );
    return rows[0];
  }
  static async findById(id) {
     const [rows] = await db.query(`
      SELECT concat(first_name, ' ', last_name) as fullName, 
      email, username, registration_number as matric, phone,
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
      email, username, registration_number as matric, password,
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
    static async createStudent(firstName, lastName, email, username, password) {    
    const [result] = await db.query(
      `INSERT INTO students (first_name, last_name, email, username, password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [firstName, lastName, email, username, password]
    );
    return result.insertId;
  }
  static async blockUnblockStudent(id) {
    const [result] = await db.query(
      `UPDATE students SET blocked = NOT blocked WHERE id = ?`,
      [id]  
    );
    return result.affectedRows > 0;
  }
  static async changePassword(password, id) {
    const [result] = await db.query(
      `UPDATE students SET password = ?, updated_at = NOW() WHERE id = ?`,
      [password, id]
    );
    return result.affectedRows > 0;
  }
  static async resetPassword(user, password) {
    const [result] = await db.query(`
      UPDATE students
      set password = ?
      where id = ?`, [password, user]);
      return result.affectedRows > 0;
  }

  static async resetAllPasswords(newPassword) {
    const [result] = await db.query(`
      UPDATE students
      set password = ?`, [newPassword]);
      return result.affectedRows;
  }
}
module.exports = Student;