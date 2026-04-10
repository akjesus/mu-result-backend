const db = require("../config/database");

class Student {
  static async execute(query, params) {
    return db.query(query, params);
  }
  static async findByUsername(username) {
    const [rows] = await db.query(
      `SELECT * FROM students WHERE LOWER(mat_no) = ? or email = ?`,
      [username.toLowerCase(), username],
    );
    return rows[0];
  }
  static async findById(id) {
    const [rows] = await db.query(
      `
      SELECT concat(last_name, ' ', first_name, ' ', other_names) as fullName, 
      email, mat_no as matric, phone, gender,
      IF(blocked, 'true', 'false') AS blocked,
      departments.name as department, photo,
      levels.name as level,
      faculties.name as school
      FROM students 
      LEFT JOIN departments ON students.department_id = departments.id
      LEFT JOIN faculties ON departments.faculty_id = faculties.id
      LEFT JOIN levels ON students.level_id = levels.id
      WHERE students.id = ?`,
      [id],
    );
    return rows.length ? rows[0] : null;
  }
  static async findByIdPass(id) {
    const [rows] = await db.query(
      `
      SELECT students.id, concat(last_name, ' ', first_name, ' ', other_names) as fullName, 
      email, mat_no as matric, password,
      IF(blocked, 'true', 'false') AS blocked,
      departments.name as department,
      levels.name as level,
      faculties.name as school
      FROM students 
      LEFT JOIN departments ON students.department_id = departments.id
      LEFT JOIN faculties ON departments.faculty_id = faculties.id
      LEFT JOIN levels ON students.level_id = levels.id
      WHERE students.id = ?`,
      [id],
    );
    return rows.length ? rows[0] : null;
  }
  static async createStudent(
    department,
    level,
    first_name,
    last_name,
    other_names,
    email,
    matric,
    password,
  ) {
    const [result] = await db.query(
      `INSERT INTO students (department_id, level_id, first_name, last_name, other_names,email, mat_no, password, created_at, updated_at, role, blocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)`,
      [
        department,
        level,
        first_name,
        last_name,
        other_names,
        email,
        matric,
        password,
        "student",
        0,
      ],
    );
    return result.insertId;
  }
  static async blockUnblockStudent(id) {
    const [result] = await db.query(
      `UPDATE students SET blocked = NOT blocked WHERE id = ?`,
      [id],
    );
    return result.affectedRows > 0;
  }
  static async changeSettings(id, updates) {
    let query = "UPDATE students SET ";
    const params = [];

    // Dynamically build the query based on provided fields
    Object.keys(updates).forEach((key, index) => {
      query += `${key} = ?`;
      if (index < Object.keys(updates).length - 1) {
        query += ", ";
      }
      params.push(updates[key]);
    });

    query += ", updated_at = NOW() WHERE id = ?";
    params.push(id);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }
  static async resetPassword(user, password) {
    const [result] = await db.query(
      `
      UPDATE students
      set password = ?
      where id = ?`,
      [password, user],
    );
    return result.affectedRows > 0;
  }
  static async resetAllPasswords(newPassword) {
    const [result] = await db.query(
      `
      UPDATE students
      set password = ?`,
      [newPassword],
    );
    return result.affectedRows;
  }
  static async findByMatNo(mat_no) {
    const [rows] = await db.query(
      `SELECT * FROM students WHERE LOWER(mat_no) = ?`,
      [mat_no.toLowerCase()],
    );
    return rows[0];
  }
}
module.exports = Student;
