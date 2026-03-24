const db = require("../config/database");

class Semester {
    static async getAllSemesters() {
        const [rows] = await db.query('SELECT * FROM semesters');
        return rows;
    }
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM semesters WHERE id = ?', [id]);
        return rows.length ? rows[0] : null;
    }
    static async createSemester(name, sessionId) {
        const [result] = await db.query(
            'INSERT INTO semesters (name, session_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', 
            [name, sessionId]
        );
        return result.insertId;
    }
    static async updateSemester(id, name, sessionId) {
        const [result] = await db.query(
            'UPDATE semesters SET name = ?, session_id = ?, updated_at = NOW() WHERE id = ?',
            [name, sessionId, id]
        );
        return result.affectedRows > 0;
    }
    static async deleteSemester(id) {
        const [result] = await db.query('DELETE FROM semesters WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    static async activateSemester(id) {
        // Set all semesters inactive first
        await db.query('UPDATE semesters SET active = 0');
        // Set the selected semester active
        const [result] = await db.query('UPDATE semesters SET active = 1 WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    
    static async getSemestersForSession(sessionId) {
        const [rows] = await db.query('SELECT id, name FROM semesters WHERE session_id = ?', [sessionId]);
        return rows;
    }
}
module.exports = Semester;
