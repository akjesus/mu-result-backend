//controller function to feed frontend dashboard with data
const db = require('../config/database');
const Result = require('../models/resultModel');

exports.getDashboardData = async (req, res) => {
  try {
    const [studentCountResult] = await db.query('SELECT COUNT(*) AS studentCount FROM students');
    const [courseCountResult] = await db.query('SELECT COUNT(*) AS courseCount FROM courses');
    const [departmentCountResult] = await db.query('SELECT COUNT(*) AS departmentCount FROM departments');
    const {highestCGPA, lowestCGPA} = await Result.getHighestandLowestCGPA();
    const avgCGPA = await Result.averageCGPA();

    const dashboardData = {
      totalStudents: studentCountResult[0].studentCount,
      totalCourses: courseCountResult[0].courseCount,
      totalDepartments: departmentCountResult[0].departmentCount,
      highestCGPA: highestCGPA ? parseFloat(highestCGPA.cgpa) : null,
      highestGPA: highestCGPA ? parseFloat(highestCGPA.cgpa) : null,
      lowestCGPA: lowestCGPA ? parseFloat(lowestCGPA.cgpa) : null,
      lowestGPA: lowestCGPA ? parseFloat(lowestCGPA.cgpa) : null,
      avgCGPA: avgCGPA ? parseFloat(avgCGPA) : null,
    }
    return res.status(200).json({ success: true, code: 200, dashboardData });
    } catch (error) {
        console.log('Error fetching dashboard data:', error.message);
        return res.status(500).json({ success: false, code: 500, message: error.message });
    }
};
