// routes/course.route.js
import express from 'express';
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses,
  getCourseStats,
  activateCourse,
  deactivateCourse,
  archiveCourse,
  enrollStudent,
  withdrawStudent,
  addClass,
  removeClass,
  addQuiz,
  removeQuiz,
  getCoursesByDepartment,
  getCoursesByStatus,
  getActiveCourses,
  getCourseByCode
} from '../controllers/course.controllers.js';
import { validateCourse, validateCourseUpdate } from '../middlewares/validation.middleware.js';

const courseRoutes = express.Router();

// GET all courses with optional filters
courseRoutes.get('/', getAllCourses);

// GET course statistics
courseRoutes.get('/stats', getCourseStats);

// GET active courses
courseRoutes.get('/active', getActiveCourses);

// GET courses by department
courseRoutes.get('/department/:department', getCoursesByDepartment);

// GET courses by status
courseRoutes.get('/status/:status', getCoursesByStatus);

// GET course by code
courseRoutes.get('/code/:code', getCourseByCode);

// Search courses
courseRoutes.get('/search', searchCourses);

// GET single course by ID
courseRoutes.get('/:id', getCourseById);

// POST create new course
courseRoutes.post('/', validateCourse, createCourse);

// PUT update course
courseRoutes.put('/:id', validateCourseUpdate, updateCourse);

// DELETE course
courseRoutes.delete('/:id', deleteCourse);

// PATCH activate course
courseRoutes.patch('/:id/activate', activateCourse);

// PATCH deactivate course
courseRoutes.patch('/:id/deactivate', deactivateCourse);

// PATCH archive course
courseRoutes.patch('/:id/archive', archiveCourse);

// PATCH enroll student
courseRoutes.patch('/:id/enroll', enrollStudent);

// PATCH withdraw student
courseRoutes.patch('/:id/withdraw', withdrawStudent);

// PATCH add class
courseRoutes.patch('/:id/add-class', addClass);

// PATCH remove class
courseRoutes.patch('/:id/remove-class', removeClass);

// PATCH add quiz
courseRoutes.patch('/:id/add-quiz', addQuiz);

// PATCH remove quiz
courseRoutes.patch('/:id/remove-quiz', removeQuiz);

export default courseRoutes;