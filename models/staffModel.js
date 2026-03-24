// models/Admin.js
const db = require("../config/database");
const bcrypt = require("bcrypt");

class Staff {
  static async findByUsername(username) {
    const [rows] = await db.query(`SELECT * 
      FROM staff 
      WHERE username = ? 
      or email = ?`, [username, username]);
    return rows.length ? rows[0] : null;
  }
static async findById(id) {
    const [rows] = await db.query("SELECT * FROM staff WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  }
  static async createStaff(firstName, lastName, email, username,) {
    const password = await bcrypt.hash("staff1234", 10);
    const [result] = await db.query(
      `INSERT INTO staff (role, first_name, last_name, email, username, password, created_at, updated_at)
       VALUES ('staff', ?, ?, ?, ?, ?, NOW(), NOW())`,
      [firstName, lastName, email, username, password]
    );
    return result.insertId;
  }

  static async getAllStaff() {
    const [result ] = await db.query(`
      SELECT *
      FROM staff
      LIMIT ?
      OFFSET ?
    `, [100, 0]); // Example limit and offset
    return result;
  }
  static async deleteStaff(id) {
    const [result] = await db.query(
      `DELETE FROM staff WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
  static async updatePassword(id, newPassword) {
    const [result] = await db.query(
      `UPDATE staff SET password = ? WHERE id = ?`,
      [newPassword, id]
    );
    return result.affectedRows > 0;
  }
  static async updateStaff(id, firstName, lastName, email, username) {
    const [result] = await db.query(
      `UPDATE staff 
       SET first_name = ?, last_name = ?, email = ?, username = ?, updated_at = NOW() 
       WHERE id = ?`,
      [firstName, lastName, email, username, id]
    );
    return result.affectedRows > 0;
  }
  
}



module.exports = Staff;
