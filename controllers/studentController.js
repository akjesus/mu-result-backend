const Student = require("../models/studentModel");
const bcrypt = require("bcrypt");
const csvParser = require('csv-parser');
const stream = require('stream');
const db = require("../config/database");
const SERVER_URL = process.env.DATABASE_SERVER

//get all users from the sql database and paginate the results

exports.getAllStudents = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || null;
  const department = parseInt(req.query.department) || null;
  const level = parseInt(req.query.level) || null;
  try {
    const offset = (page - 1) * limit;
    let query = `SELECT  first_name, last_name, 
    email, registration_number as matric, username,
    departments.name AS department, levels.name AS level,
    faculties.name AS school 
    FROM students
    JOIN departments ON students.department_id = departments.id
    JOIN levels ON students.level_id = levels.id
    JOIN faculties ON departments.faculty_id = faculties.id`;
    let countQuery = 'SELECT COUNT(*) as total FROM students';

    const conditions = ['blocked = 0'];
    const params = [];

    if (department) {
      conditions.push('department_id = ?');
      params.push(department);
    }

    if (level) {
      conditions.push('level_id = ?');
      params.push(level);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Add pagination params at the end for the main query
    if(limit) query += ' LIMIT ? OFFSET ?';
    const queryParams = [...params, limit, offset];
    const [students] = await Student.execute(query, queryParams);
    // Only use filter params for count query
    const [[{ total }]] = await Student.execute(countQuery, params);

    return res.status(200).json({success: true, code: 200,
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, code: 500, message: error.message });
  }
}


exports.getUserById = async (req, res) => {
  const userId = parseInt(req.params.id);
    try {
        const user = await Student.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, code: 404, message: 'User not found' });
        }   
        return res.status(200).json({success: true, code: 200, user});
    } catch (error) {
        console.log('Error fetching user by ID:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};


exports.createStudent = async (req, res) => {
    try {
         
      const { firstName, lastName, email, username, password, department, level } = req.body;
       
      if (!firstName || !lastName || !email || !username || !password || department || level) {
        return res.status(400).json({ success: false, code: 400, message: "All fields are required!" });
      }

        const existing = await Student.findByUsername(email);
        if(existing) {
          return res.status(409).json({success: false, code: 409, message: "Email exists already" })
        }
        const studentId = await Student.createStudent(firstName, lastName, email, username, password, department, level);
        return res.status(201).json({ success: true, code: 201, message:  "Student created successfully", id: studentId });
    

    } catch (err) {
      res.status(500).json({ success: false, code: 500, message:  err.message });
    }
  };


exports.resetPassword = async (req, res) => {
    try {
      const { id} = req.params;
        if ( !id ) {
            return res.status(400).json({ success: false, code: 400, message: "ID required!" });
        }
        // Implement password reset logic here
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ success: false, code: 404, message: "Student not found!" });
        }
        const newPassword = await bcrypt.hash("password", 10);
        await Student.execute(`UPDATE students SET password = ? WHERE id = ?`, [newPassword, student.id]);
        return res.status(200).json({ success: true, code: 200, message:  "Password reset successful" });
    } catch (err) {
      return res.status(500).json({ success: false, code: 500, message:  err.message });
    }
};


exports.deleteUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {   
        const user = await Student.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, code: 404, message:  'User not found' });
        }
        await Student.execute('DELETE FROM students WHERE id = ?', [userId]);
        return res.status(200).json({ success: true, code: 200, message:  'User deleted successfully' });
    } catch (error) {
        console.log('Error deleting user:', error);
        return res.status(500).json({ success: false, code: 500, message:  error });
    }
};


exports.updateUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, email, username, role, department, level } = req.body; 
    let table = role === 'student' ? 'students' : 'staff';
    try {
        const user = await Student.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, code: 404, message:'User not found' });
        }
        await Student.execute(`
            UPDATE ${table} 
            SET first_name = ?, 
            last_name = ?, 
            email = ?, 
            username = ?,
            department_id = ?,
            level_id = ? 
            WHERE id = ?`, 
        [firstName, lastName, email, username, department, level, userId]);  
        return res.status(200).json({ success: true, code: 200, message:'User updated successfully', user }); 
    } catch (error) {
        console.log('Error updating user:', error);
        return res.status(500).json({ success: false, code: 500, message:error });
    }
};

exports.blockUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        const user = await Student.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, code: 500, message: 'User not found' });
        }
        await Student.blockUnblockStudent(userId);
        const message = user.blocked ? 'User unblocked successfully' : 'User blocked successfully';
        return res.status(200).json({ success: true, code: 200,  message });
    } catch (error) {
        console.log('Error blocking user:', error);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

exports.bulkUploadStudents = async (req, res) => {
  try {
    // Check if file is present
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const csvFile = req.files.file;
    const bufferStream = new stream.PassThrough();
    bufferStream.end(csvFile.data);

    const studentsToImsert = []; // for student fields
    // We'll store them as arrays of [course_id, level_id, ... user_id], then link after

    bufferStream
      .pipe(csvParser())
      .on("data", (row) => {
        // Extract the fields from CSV row
        // We'll parse them carefully, assuming columns are consistent
        const {
          department_id,
          level_id,
          registration_number,
          first_name,
          last_name,
          email,
          username,
          password,
          photo,
        } = row;

        // We'll store this row data
        studentsToImsert.push({
          department_id,
          level_id,
          registration_number,
          first_name,
          last_name,
          email,
          username,
          password,
          photo,
        });
      })
      .on("end", async () => {
        if (!studentsToImsert.length) {
          return res
            .status(400)
            .json({ error: "No valid student data found in CSV" });
        }

        let insertedCount = 0;

        // We'll process each question row individually
        for (const qRow of studentsToImsert) {
          // Insert new question

            const [insertRes] = await db.query(
              `INSERT INTO students 
               (department_id, level_id, registration_number, first_name, last_name, email, username,
                password, photo, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [
                qRow.department_id,
                qRow.level_id,
                qRow.registration_number,
                qRow.first_name,
                qRow.last_name,
                qRow.email,
                qRow.username,
                qRow.password,
                qRow.photo,
              ]
            );
            insertedCount++;

        }
        res.status(201).json({
          message: `${insertedCount} students successfully uploaded`,
        });
      });
  } catch (err) {
    res.status(500).json({ success: false, code: 500, error: err.message });
  }
};


exports.bulkDownloadStudents = async (req, res) => {
  try {
    const [students] = await Student.execute(`
      SELECT registration_number as RegitrationNumber, concat(first_name,' ', last_name) as Fullname, 
      email as Email, departments.name as Department, levels.name As Level, 
      faculties.name as Faculty
      FROM students
      JOIN departments ON students.department_id = departments.id
      JOIN levels ON students.level_id = levels.id
      JOIN faculties ON departments.faculty_id = faculties.id
      ORDER BY students.registration_number DESC
    `);
    if (!students.length) {
      return res.status(404).json({ error: "No students found" });
    }
    // Convert to CSV format
    const csvHeaders = [
      "RegitrationNumber",
      "Fullname",
      "Email",
      "Department",
      "Level",
      "Faculty",
    ];
    const csvRows = [
      csvHeaders.join(","), // Header row
      ...students.map((s) =>
        csvHeaders.map((header) => `"${s[header] || ""}"`).join(",")
      ),
    ];
    const csvContent = csvRows.join("\n");
    res.setHeader("Content-Disposition", "attachment; filename=students.csv");
    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(csvContent);
  }
  catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};


exports.getMyProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, code: 404, message: "User not found" });
    }
    const userDetails = await Student.findById(user.id);
    if (!userDetails) {
      return res.status(404).json({ success: false, code: 404, message: "User details not found" });
    } 
    return res.status(200).json({ success: true, code: 200, userDetails });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, code: 500, message: err.message });
  }

}

exports.updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ success: false, code: 400, message: "No file uploaded. Multer did not parse a file." });
    }
    const fileUrl = `http://${SERVER_URL}:5000/uploads/${req.file.originalname}`;
    await Student.execute('UPDATE students SET photo = ? WHERE id = ?', [fileUrl, userId]);
    return res.status(200).json({ success: true, code: 200, message: "Profile picture updated", url: fileUrl });
  } catch (err) {
    console.log('Error updating profile picture:', err);
    return res.status(500).json({ success: false, code: 500, message: err.message });
  }
}

exports.getStudentsByDepartment = async (req, res) => {
  const levelId = req.query.levelId ? parseInt(req.query.levelId) : null;
  const departmentId = parseInt(req.query.departmentId);
  if (!departmentId) {
    return res.status(400).json({ success: false, code: 400, message: "Department required" });
  }
  try {
    let query = `
      SELECT students.id as id, concat(first_name, ' ', last_name) as name,
      first_name, last_name, registration_number as matric,
      email, departments.name as department,
      faculties.name as school
      FROM students
      JOIN departments ON students.department_id = departments.id
      JOIN faculties ON departments.faculty_id = faculties.id
      WHERE department_id = ?`;
    const params = [departmentId];
    if (levelId) {
      query += ' AND students.level_id = ?';
      params.push(levelId);
    }
    const [students] = await db.query(query, params);
    if (!students.length) {
      return res.status(404).json({ success: false, code: 404, message: 'No students found for this department' });
    }
    return res.status(200).json({ success: true, code: 200, students });
  } catch (error) {
    console.log('Error fetching students by department:', error);
    return res.status(500).json({ success: false, code: 500, message: error.message });
  }
};

exports.resetAllPasswords = async (req, res) => {
  try {
    const newPassword = await bcrypt.hash("password", 10);  
    const affectedRows = await Student.resetAllPasswords(newPassword);
    return res.status(200).json({ success: true, code: 200, message:  `Passwords reset successful for ${affectedRows} students` });
  }
  catch (error) {
    console.log('Error resetting all passwords:', error);
    return res.status(500).json({ success: false, code: 500, message: error.message });
  }
};
