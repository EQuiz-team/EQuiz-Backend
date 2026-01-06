// controllers/course.controller.js
import Course from '../models/course.model.js';

// Get all courses with optional filters
export const getAllCourses = async (req, res) => {
  try {
    const { department, status, semester, page = 1, limit = 10 } = req.query;
    const where = {};
    
    if (department) where.department = department;
    if (status) where.status = status;
    if (semester) where.semester = semester;
    
    const offset = (page - 1) * limit;
    
    const { count, rows: courses } = await Course.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      courses,
      showing: `${offset + 1}-${Math.min(offset + courses.length, count)} of ${count} courses`
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch courses',
      details: error.message 
    });
  }
};

// Get course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch course',
      details: error.message 
    });
  }
};

// Get course by code
export const getCourseByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const course = await Course.findByCode(code);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch course',
      details: error.message 
    });
  }
};

// Create new course
export const createCourse = async (req, res) => {
  try {
    const courseData = req.body;
    
    // Check if course with same code already exists
    const existingCourse = await Course.findByCode(courseData.code);
    if (existingCourse) {
      return res.status(400).json({ error: 'Course with this code already exists' });
    }
    
    const course = await Course.create(courseData);
    res.status(201).json({
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Failed to create course',
      details: error.message 
    });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // If code is being updated, check if new code already exists
    if (updates.code && updates.code !== course.code) {
      const existingCourse = await Course.findByCode(updates.code);
      if (existingCourse && existingCourse.id !== id) {
        return res.status(400).json({ error: 'Course with this code already exists' });
      }
    }
    
    await course.update(updates);
    res.json({
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    res.status(400).json({ 
      error: 'Failed to update course',
      details: error.message 
    });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await course.destroy();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete course',
      details: error.message 
    });
  }
};

// Search courses
export const searchCourses = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: courses } = await Course.findAndCountAll({
      where: {
        [Course.sequelize.Op.or]: [
          { code: { [Course.sequelize.Op.iLike]: `%${q}%` } },
          { courseName: { [Course.sequelize.Op.iLike]: `%${q}%` } },
          { department: { [Course.sequelize.Op.iLike]: `%${q}%` } },
          { description: { [Course.sequelize.Op.iLike]: `%${q}%` } }
        ]
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      query: q,
      courses,
      showing: `${offset + 1}-${Math.min(offset + courses.length, count)} of ${count} courses`
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to search courses',
      details: error.message 
    });
  }
};

// Get course statistics
export const getCourseStats = async (req, res) => {
  try {
    const stats = await Course.getCourseStats();
    
    // Calculate overall totals
    const overallStats = {
      totalCourses: await Course.count(),
      totalStudents: await Course.sum('students'),
      totalClasses: await Course.sum('classes'),
      totalQuizzes: await Course.sum('quizzes'),
      activeCourses: await Course.count({ where: { status: 'ACTIVE' } }),
      inactiveCourses: await Course.count({ where: { status: 'INACTIVE' } }),
      archivedCourses: await Course.count({ where: { status: 'ARCHIVED' } })
    };
    
    res.json({
      overall: overallStats,
      byDepartment: stats
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch course statistics',
      details: error.message 
    });
  }
};

// Get courses by department
export const getCoursesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const courses = await Course.findByDepartment(department);
    
    res.json({
      department,
      total: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch courses by department',
      details: error.message 
    });
  }
};

// Get courses by status
export const getCoursesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }
    
    const courses = await Course.findByStatus(status.toUpperCase());
    
    res.json({
      status: status.toUpperCase(),
      total: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch courses by status',
      details: error.message 
    });
  }
};

// Get active courses
export const getActiveCourses = async (req, res) => {
  try {
    const courses = await Course.findActiveCourses();
    
    res.json({
      status: 'ACTIVE',
      total: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch active courses',
      details: error.message 
    });
  }
};

// Activate course
export const activateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await course.activate();
    res.json({ 
      message: 'Course activated successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to activate course',
      details: error.message 
    });
  }
};

// Deactivate course
export const deactivateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await course.deactivate();
    res.json({ 
      message: 'Course deactivated successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to deactivate course',
      details: error.message 
    });
  }
};

// Archive course
export const archiveCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await course.archive();
    res.json({ 
      message: 'Course archived successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to archive course',
      details: error.message 
    });
  }
};

// Enroll student
export const enrollStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await course.enrollStudent();
    res.json({ 
      message: 'Student enrolled successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to enroll student',
      details: error.message 
    });
  }
};

// Withdraw student
export const withdrawStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.students === 0) {
      return res.status(400).json({ error: 'No students to withdraw' });
    }
    
    await course.withdrawStudent();
    res.json({ 
      message: 'Student withdrawn successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to withdraw student',
      details: error.message 
    });
  }
};

// Add class
export const addClass = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await course.addClass();
    res.json({ 
      message: 'Class added successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to add class',
      details: error.message 
    });
  }
};

// Remove class
export const removeClass = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.classes === 0) {
      return res.status(400).json({ error: 'No classes to remove' });
    }
    
    await course.removeClass();
    res.json({ 
      message: 'Class removed successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to remove class',
      details: error.message 
    });
  }
};

// Add quiz
export const addQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await course.addQuiz();
    res.json({ 
      message: 'Quiz added successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to add quiz',
      details: error.message 
    });
  }
};

// Remove quiz
export const removeQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.quizzes === 0) {
      return res.status(400).json({ error: 'No quizzes to remove' });
    }
    
    await course.removeQuiz();
    res.json({ 
      message: 'Quiz removed successfully',
      course 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to remove quiz',
      details: error.message 
    });
  }
};