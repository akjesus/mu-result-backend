const db = require("../config/database");

class Session {
  static async getAllSessions() {
    const [rows] = await db.query(`
            SELECT sessions.id as id, sessions.name as name, 
            IF(sessions.active, 'true', 'false') as active
            FROM sessions `);
    // For each session, fetch semesters
    for (let session of rows) {
      const [semRows] = await db.query(
        `
                SELECT id, name FROM semesters WHERE session_id = ?
            `,
        [session.id],
      );
      session.semesters = semRows;
    }
    return rows;
  }
  static async findById(id) {
    const [rows] = await db.query("SELECT * FROM sessions WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  }
  static async createSession(name, start_date,  end_date) {
    const [result] = await db.query(
      "INSERT INTO sessions (name, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [name, start_date, end_date],
    );
    return result.insertId;
  }
  static async updateSession(id, name, start_date, end_date) {
    const [result] = await db.query(
      "UPDATE sessions SET name = ?, start_date = ?, end_date = ?, updated_at = NOW() WHERE id = ?",
      [name, start_date, end_date, id],
    );
    return result.affectedRows > 0;
  }
  static async deleteSession(id) {
    const [result] = await db.query("DELETE FROM sessions WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }

  static async activateSession(id) {
    const [result] = await db.query(
      "UPDATE sessions SET active = 1 WHERE id = ?)",
      [id],
    );
    return result.affectedRows > 0;
  }
  static async getSemestersForSession(sessionId) {
    const [rows] = await db.query(
      "SELECT id, name FROM semesters WHERE session_id = ?",
      [sessionId],
    );
    return rows;
  }
  static async getSessions() {
    const [rows] = await db.query(
      "SELECT * FROM sessions",
    );
    return rows;
  }
}
module.exports = Session;
