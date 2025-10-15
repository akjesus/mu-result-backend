const Result = require("../models/resultModel");
const db = require("../config/database");
const Student = require("../models/studentModel");
const Course = require("../models/courseModel");

// Get all results with pagination
exports.getAllResults = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // Accept department, level, session, semester from query params
    const department = req.query.department ? parseInt(req.query.department) : null;
    const level = req.query.level ? parseInt(req.query.level) : null;
    const session = req.query.session ? parseInt(req.query.session) : null;
    const semester = req.query.semester ? parseInt(req.query.semester) : null;

    try {
        const offset = (page - 1) * limit;
        // Build dynamic WHERE clause and params
        let whereClauses = ['results.blocked = 0'];
        let params = [];
        if (department) {
            whereClauses.push('students.department_id = ?');
            params.push(department);
        }
        if (level) {
            whereClauses.push('students.level_id = ?');
            params.push(level);
        }
        if (session) {
            whereClauses.push('results.session_id = ?');
            params.push(session);
        }
        if (semester) {
            whereClauses.push('results.semester_id = ?');
            params.push(semester);
        }
        const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
        let query = `SELECT (results.cat_score + results.exam_score) as total_score, 
            results.grade, CONCAT(students.first_name,' ', students.last_name)as student_name, 
            courses.name AS course, semesters.name AS semester,
            sessions.name AS session, departments.name AS department, levels.name AS level
            FROM results
            JOIN students ON results.registration_number = students.registration_number
            JOIN courses ON results.course_id = courses.id
            JOIN sessions ON results.session_id = sessions.id
            JOIN semesters ON results.semester_id = semesters.id
            JOIN levels ON students.level_id = levels.id
            JOIN departments ON students.department_id = departments.id
            ${whereSQL}
            LIMIT ? OFFSET ?`;
        let countQuery = `SELECT COUNT(*) as total FROM results
            JOIN students ON results.registration_number = students.registration_number
            ${whereSQL}`;
        const queryParams = [...params, limit, offset];
        const [results] = await Result.execute(query, queryParams);
        const [[{ total }]] = await Result.execute(countQuery, params);
        return res.status(200).json({
            success: true, code: 200, message: "All results fetched successfully",
            results,
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
};

// Get a single result by ID
exports.getResultById = async (req, res) => {
    const resultId = parseInt(req.params.id);
    try {
        const result = await Result.findById(resultId);
        if (!result) {
            return res.status(404).json({ success: false, code: 404, message: 'Result not found' });
        }
        return res.status(200).json({success: true, code: 200, result});
    } catch (error) {
        console.log(`Error fetching result by ID:${resultId}`, error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

exports.createResult = async (req, res) => {
    const { registration_number, course_id, cat_score, exam_score, semester_id, session_id } = req.body.results;
    //validate inputs
    if (!registration_number || !course_id || !cat_score  || !exam_score  || !semester_id || !session_id ) {
        return res.status(400).json({ success: false, code: 400, message: "All fields are required!" });
    }

    try {
        // Check for duplicate
        const [existing] = await Result.findByStudentAndCourse(registration_number, course_id);
        if (existing && existing.length > 0) {
            return res.status(409).json({ success: false, code: 409, message: "Result for this student and course already exists!" });
        }

        const newResultId = await Result.createResult(registration_number, course_id, cat_score, exam_score, semester_id, session_id);
        return res.status(201).json({success: true, code: 201, message: 'Result created successfully', result_id: newResultId });
    }
    catch (error) {
        console.log('Error creating result:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

// Update an existing result
exports.updateResult = async (req, res) => {
    const resultId = parseInt(req.params.id);
    const { student_id, course_id, score, grade, semester_id, level_id } = req.body;
    try {
        const updated = await Result.updateResult(resultId, student_id, course_id, score, grade, semester_id, level_id);
        if (!updated) {
            return res.status(404).json({ success: false, code: 404, message: 'Result not found or no changes made' });
        }
        return res.status(200).json({ success: true, code: 200, message: 'Result updated successfully' });
    } catch (error) {
        console.log('Error updating result:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
// Delete a result
exports.deleteResult = async (req, res) => {
    const resultId = parseInt(req.params.id);
    try {
        const deleted = await Result.deleteResult(resultId);
        if (!deleted) {
            return res.status(404).json({ success: false, code: 404, message: 'Result not found' });
        }
        return res.status(200).json({ success: true, code: 200, message: 'Result deleted successfully' });
    }
    catch (error) {
        console.log('Error deleting result:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

//bulk upload results
exports.bulkUploadResults = async (req, res) => {
    console.log('bulkUploadResults route called');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, code: 400, message: "No file uploaded!" });
        }
        const resultsFile = req.file;
        const {session_id, course_id, semester_id} = req.body;
        if(!session_id || !semester_id) {
            return res.status(400).json({ success: false, code: 400, message: "Session ID and Semester ID are required!" });
        }
        const course = await Course.findById(course_id);
        if(!course || course.length === 0) {
            return res.status(400).json({ success: false, code: 400, message: "Invalid Course ID!" });  
        }
        const fileExtension = resultsFile.originalname.split('.').pop().toLowerCase();
        if (fileExtension !== 'csv') {
            return res.status(400).json({ success: false, code: 400, message: "Only CSV files are allowed!" });
        }

        const csv = require('csv-parser');
        const stream = require('stream');
        const results = [];
        const readableStream = new stream.Readable();
        readableStream._read = () => {};
        readableStream.push(resultsFile.buffer);
        readableStream.push(null);
        readableStream.pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let insertedCount = 0;
            let errorCount = 0;
            let errorRows = [];
            for (const r of results) {
                const registration_number = r.registration_number;
                // Check for duplicate
                try {
                    const [existing] = await Result.findByStudentAndCourse(registration_number, course_id);
                    if (existing && existing.length > 0) {
                        console.log(`Duplicate found for ${registration_number}, skipping.`);
                        continue;
                    }
                    const result = await Result.createResult(
                        registration_number,
                        course_id,
                        parseFloat(r.cat_score),
                        parseFloat(r.exam_score),
                        session_id,
                        semester_id
                    );
                    console.log(`Inserted result for ${registration_number}:`, result);
                    insertedCount++;
                } catch (error) {
                    errorCount++;
                    errorRows.push({ row: r, error: error.message });
                    console.log(`Error inserting row for ${registration_number}:`, error.message);
                    continue;
                }
            }
            console.log(`Bulk upload finished: ${insertedCount} inserted, ${errorCount} errors.`);
            if (errorCount > 0) {
                return res.status(200).json({success: true, code: 200, message: `${insertedCount} results uploaded, ${errorCount} errors (see server logs for details)`, errors: errorRows });
            }
            return res.status(200).json({success: true, code: 200, message: `${insertedCount} results uploaded successfully (duplicates skipped)` });
        })
        .on('error', (err) => {
            console.log('Error parsing CSV:', err.message);
            return res.status(500).json({success: false, code: 500, message: "Error parsing CSV file" });
        });
    } catch (error) {
        console.log('Error uploading results:', error.message);
        return res.status(500).json({success: false, code: 500, message: error.message });
    }
};


exports.getResultsByStudent = async (req, res) => {
    const user = req.user;
    const userDetails = await Student.findById(user.id);
    if (!userDetails) {
        return res.status(404).json({ success: false, code: 404, message: 'User details not found' });  
    }
    const registration_number = userDetails.matric;
    try {
        // Destructure from query
        const { session, level, semester } = req.query;
        if (!session || !level) {
            return res.status(400).json({ success: false, code: 400, message: "Session and Level are required!" });
        }
        let results;
        if (semester) {
            // Fetch for specific semester
            [results] = await db.query(
                `SELECT results.id, results.course_id, courses.code as code, courses.name AS title, students.first_name, 
                students.last_name, students.registration_number, 
                results.cat_score + results.exam_score AS total_score, results.grade,
                courses.credit_load as credit, semesters.name as semester, sessions.name as session
                FROM results
                JOIN courses ON results.course_id = courses.id
                JOIN students ON results.registration_number = students.registration_number
                JOIN sessions ON results.session_id = sessions.id
                JOIN semesters ON results.semester_id = semesters.id
                WHERE results.registration_number = ?
                AND results.session_id = ?
                AND results.semester_id = ?
                AND students.level_id = ? 
                AND results.blocked = 0 `,
                [registration_number, session, semester, level]
            );
        } else {
            // Fetch for session only (all semesters)
            [results] = await db.query(
                `SELECT results.id, results.course_id, courses.code as code, courses.name AS title, students.first_name, 
                students.last_name, students.registration_number, 
                results.cat_score + results.exam_score AS total_score, results.grade,
                courses.credit_load as credit, semesters.name as semester, sessions.name as session
                FROM results
                JOIN courses ON results.course_id = courses.id
                JOIN students ON results.registration_number = students.registration_number
                JOIN sessions ON results.session_id = sessions.id
                JOIN semesters ON results.semester_id = semesters.id
                WHERE results.registration_number = ?
                AND results.session_id = ?
                AND students.level_id = ? 
                AND results.blocked = 0 `,
                [registration_number, session, level]
            );
        }
        if(results.length === 0) {
            return res.status(200).json({ success: true, code: 404, message: `No results for this session${semester ? ' and semester' : ''} yet` });
        }
        return res.status(200).json({success: true, code: 200, results, student: userDetails});
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, code: 500, message: err.message });
    }
};

exports.getResultsByDepartment = async (req, res) => {
    try {
        const departmentId = req.params.id;
        const [results] = await db.query(
            `SELECT  results.id, departments.name as department_name, courses.name AS course_name, 
            students.first_name, students.last_name, 
                    students.registration_number,    
                    results.cat_score + results.exam_score AS total_score, results.grade,
                    courses.credit_load
             FROM results
             JOIN courses ON results.course_id = courses.id
             JOIN students ON results.registration_number = students.registration_number
             JOIN departments ON students.department_id = departments.id
             WHERE departments.id = ?`,
            [departmentId]
        );
        return res.status(200).json({success: true, code: 200, results});
    } catch (err) {
        return res.status(500).json({ success: false, code: 500, message: err.message });
    }
};

exports.getResultsByCourse = async (req, res) => {
    try {
        const courseId = req.params.id;
        const [results] = await db.query(
            `SELECT results.id,  courses.name AS course_name, students.first_name, 
            students.last_name, students.registration_number, results.cat_score, results.exam_score,
            results.cat_score + results.exam_score AS total_score, results.grade
             FROM results
             JOIN courses ON results.course_id = courses.id
             JOIN students ON results.registration_number = students.registration_number
             WHERE courses.id = ?`,
            [courseId]
        );
        return res.status(200).json({success: true, code: 200, results});
    } catch (err) {
        return res.status(500).json({success: false, code: 500, message: err.message });
    }
};


exports.getResultsByDepartmentAndLevel = async (req, res) => {
    try {
        const { deptId, levelId } = req.params;
        if (!deptId || !levelId) {
            return res.status(400).json({ error: "Department ID and Level ID are required!" });
        }
        const [results] = await db.query(
            `SELECT  results.id, departments.name as department_name, courses.name AS course_name,
            students.first_name, students.last_name, 
                    students.registration_number, results.cat_score, results.exam_score,
                    results.cat_score + results.exam_score AS total_score, results.grade,       
                    courses.credit_load
             FROM results
             JOIN courses ON results.course_id = courses.id 
                JOIN students ON results.registration_number = students.registration_number
                JOIN departments ON students.department_id = departments.id
                WHERE departments.id = ? AND students.level_id = ?`,
            [deptId, levelId]
        );
        if(results.length === 0) {
            return res.status(404).json({success: false, code: 404, message: 'No results found for this department and level' });
        }
        res.json(results);
    }   catch (err) {
        res.status(500).json({ success: false, code: 500, message: err.message });
    }
};


//block a student's result
exports.blockResult = async (req, res) => {
    const registration_number = parseInt(req.params.registration_number);
    try {
        const blocked = await Result.blockUnblockResult(registration_number);
        if (!blocked) {
            return res.status(404).json({ success: false, code: 404, message: 'Result not found or already blocked' });
        }
        return res.status(200).json({ success: true, code: 200, message: 'Result blocked successfully' });
    }
    catch (error) {
        console.log('Error blocking result:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

exports.calculateCGPA = async (req, res) => {
    const registration_number = req.params.registration_number;
    try {
        const cgpa = await Result.calculateCGPA(registration_number);
        return res.status(200).json({ success: true, code: 200, registration_number, cgpa });
    } catch (error) {
        console.log('Error calculating CGPA:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
}
//function to calculate CGPA for all students
exports.calculateAllCGPA = async (req, res) => {
    try {
        const cgpas = await Result.calculateAllCGPA();
        return res.status(200).json({ success: true, code: 200, cgpas });
    } catch (error) {
        console.log('Error calculating CGPA for all students:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

//get highest and lowest CGPA from all students
exports.getHighestandLowestCGPA = async (req, res) => {
    try {
        const { highest, lowest } = await Result.getHighestandLowestCGPA();
        return res.status(200).json({ success: true, code: 200, highest, lowest });
    } catch (error) {
        console.log('Error fetching highest and lowest CGPA:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

//get all results for a student 
exports.getAllResultsForStudent = async (req, res) => {
    try {
    const student = await Student.findById(req.user.id);

    if(!student) {
        return res.status(404).json({success: false, code: 404, message: "Student not found!"});    
    }
    const result = await Result.getResultsByStudentId(student.matric);
    if(result.length === 0) {
        return res.status(404).json({success: false, code: 404, message: "No results uploaded yet"})
    }
    return res.status(200).json({success: true, code: 200, result})
    }
    catch(error) {
        console.log(error.message);
        return res.status(500).json ({success: false, code: 500, message: error.message})
    }
    

}

//get current GPA for a student
exports.getCurrentGPA = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);    
        if (!student) {
            return res.status(404).json({ success: false, code: 404, message: 'Student not found' });
        }
        const [currentSemester] = await db.query(`
            SELECT id from semesters 
            where active = 1;`);
        if (!currentSemester || currentSemester.length === 0) {
            return res.status(404).json({ success: false, code: 404, message: 'No active semester found' });
        }
        const gpa = await Result.calculateCurrentGPA(student.matric, currentSemester[0].id);
        return res.status(200).json({ success: true, code: 200, gpa });
    } catch (error) {
        console.log('Error calculating current GPA:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

exports.getallResultsforDepartment = async (req, res) => {
    try {
        const departmentId = req.params.id;
        const { session, semester } = req.query;
        if (!session || !semester) {
            return res.status(400).json({ success: false, code: 400, message: "Semester and Session are required!" });
        }
        const [results] = await db.query(
            `SELECT 
                students.registration_number as matric,
                CONCAT(students.first_name, ' ', students.last_name) AS student_name,
                departments.name AS department_name,
                levels.name AS level_name,
                sessions.name AS session_name,
                semesters.name AS semester_name,
                faculties.name AS faculty_name,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', results.id,
                        'code', courses.code,
                        'name', courses.name,
                        'grade', results.grade,
                        'cat_score', results.cat_score,
                        'exam_score', results.exam_score,
                        'total_score', results.cat_score + results.exam_score,
                        'credit_load', courses.credit_load
                    )
                ) AS courses_info
            FROM students
            JOIN departments ON students.department_id = departments.id
            JOIN faculties ON departments.faculty_id = faculties.id
            JOIN results ON students.registration_number = results.registration_number
            JOIN courses ON results.course_id = courses.id
            JOIN levels ON courses.level_id = levels.id
            JOIN sessions ON results.session_id = sessions.id
            JOIN semesters ON results.semester_id = semesters.id
            WHERE departments.id = ?
            AND results.session_id = ?
            AND results.semester_id = ?
            AND results.blocked = 0
            GROUP BY students.registration_number, students.first_name, students.last_name, departments.name, levels.name
            ORDER BY students.registration_number ASC`,
            [departmentId, session, semester]
        );
        return res.status(200).json({success: true, code: 200, results});
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, code: 500, message: err.message });
    }
}

exports.getCoursesWithResults = async (req, res) => {
    try {
        const courses = await Result.getCoursesWithResults();
        return res.status(200).json({success: true, code: 200, courses});
    } catch (err) {
        return res.status(500).json({success: false, code: 500, message: err.message });
    }
};


exports.batchUpdateResults = async (req, res) => {
    const updates = req.body.results;
    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ success: false, code: 400, message: "Updates array is required!" });
    }
    try {
        let updatedCount = 0;
        for (const update of updates) {
            const { id, cat_score, exam_score, grade } = update;
            const updated = await Result.updateResult(cat_score, exam_score, grade, id);   
            if (updated) updatedCount++;
        }
        return res.status(200).json({ success: true, code: 200, message: `${updatedCount} results updated successfully` });
    }
    catch (error) {
        console.log('Error batch updating results: .....', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
