//import required modules
const db = require('../config/database');
const Report = require('../models/reportModel');

// Controller to get student results by grade
exports.getStudentResultsByGrade = async (req, res) => {
    const grade = req.params.grade;
    try {
        const results = await Report.getStudentResultsbyGrade(grade);
        return res.status(200).json({ success: true, code: 200, results });
    } catch (error) {
        console.log('Error fetching student results by grade:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};

//get number of students by grade distribution for a course 
exports.getGradeDistributionByCourse = async (req, res) => {
    const courseId = parseInt(req.params.id);
    try {
        const distribution = await Report.getGradeDistributionByCourse(courseId);
        return res.status(200).json({ success: true, code: 200, distribution });
    }
    catch (error) {
        console.log('Error fetching grade distribution by course:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
//get number of students by grade distribution for a level in a semester and session
exports.getGradeDistributionByLevel = async (req, res) => {
    const levelId = parseInt(req.params.levelId);
    const semesterId = parseInt(req.params.semesterId);
    const sessionId = parseInt(req.params.sessionId);
    try {
        const distribution = await Report.getGradeDistributionByLevel(levelId, semesterId, sessionId);
        return res.status(200).json({ success: true, code: 200, distribution });
    }
    catch (error) {
        console.log('Error fetching grade distribution by level:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
