// routes/class.routes.js
import express from 'express';
import { classController } from '../controllers/class.controller.js';
import { authenticate, authorize } from '../middlewares/questionAuth/auth.middleware.js';

const router = express.Router();

// Class management routes
router.post('/classes', authenticate, authorize(['teacher', 'admin']), classController.createClass);
router.get('/classes', authenticate, classController.getAllClasses);
router.get('/classes/:id', authenticate, classController.getClassById);
router.put('/classes/:id', authenticate, authorize(['teacher', 'admin']), classController.updateClass);
router.delete('/classes/:id', authenticate, authorize(['teacher', 'admin']), classController.deleteClass);

// Student enrollment routes
router.post('/classes/:classId/enroll', authenticate, authorize(['teacher', 'admin']), classController.enrollStudent);
router.delete('/classes/:classId/students/:studentId', authenticate, authorize(['teacher', 'admin']), classController.removeStudent);
router.get('/classes/:classId/students', authenticate, classController.getClassStudents);
router.put('/classes/:classId/students/:studentId', authenticate, authorize(['teacher', 'admin']), classController.updateStudentEnrollment);

// Student class routes
router.get('/students/:studentId/classes', authenticate, classController.getStudentClasses);

// Instructor class routes
router.get('/instructors/:instructorId/classes', authenticate, classController.getInstructorClasses);

// Statistics routes
router.get('/classes/:classId/statistics', authenticate, classController.getClassStatistics);

export default router;