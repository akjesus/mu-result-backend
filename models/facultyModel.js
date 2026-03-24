const db = require("../config/database");

class Faculty {
    static async getAllFaculties() {
        const [result ] = await db.query(`
                SELECT  faculties.id, faculties.name
                FROM faculties 
                ORDER BY name ASC
            `);
            return result;
    }
    static async getFacultyById(id) {
        const [result ] = await db.query(`
                SELECT  faculties.id, faculties.name
                FROM faculties 
                WHERE id = ?
            `, [id]);
            return result;
    }
    static async updateFaculty(id, name) {
        const [result] = await db.query(
            `UPDATE faculties
             SET name = ?
             WHERE id = ?
            `, [id, name]
        );
        return result.affectedRows > 0;
    }
     static async createFaculty( name) {
        const [result] = await db.query(
            `INSERT into faculties
             (name)
             values(?)
            `, [name]
        );
        return result.affectedRows > 0;
    }
    
    static async deleteFaculty( id) {
        const [result] = await db.query(
            `DELETE from faculties
             where id = ?
            `, [id]
        );
        return result.affectedRows > 0;
    }

}

module.exports = Faculty