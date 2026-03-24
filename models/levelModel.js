const db = require("../config/database");

class Level {
    static async getAllLevels() {
            const [rows] = await db.query(`
                SELECT levels.id as id, levels.name as name
                FROM levels`);
            return rows;
        }

}

module.exports = Level;