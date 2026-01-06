// middleware/validation.middleware.js
import { body, param, validationResult } from 'express-validator';

export const validateCourse = [
  body('code')
    .trim()
    .notEmpty().withMessage('Course code is required')
    .isLength({ max: 50 }).withMessage('Course code must be less than 50 characters'),
  
  body('courseName')
    .trim()
    .notEmpty().withMessage('Course name is required')
    .isLength({ max: 255 }).withMessage('Course name must be less than 255 characters'),
  
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 100 }).withMessage('Department must be less than 100 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('classes')
    .optional()
    .isInt({ min: 0 }).withMessage('Classes must be a non-negative integer'),
  
  body('students')
    .optional()
    .isInt({ min: 0 }).withMessage('Students must be a non-negative integer'),
  
  body('quizzes')
    .optional()
    .isInt({ min: 0 }).withMessage('Quizzes must be a non-negative integer'),
  
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED']).withMessage('Status must be ACTIVE, INACTIVE, or ARCHIVED'),
  
  body('semester')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Semester must be less than 50 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateCourseUpdate = [
  body('code')
    .optional()
    .trim()
    .notEmpty().withMessage('Course code cannot be empty')
    .isLength({ max: 50 }).withMessage('Course code must be less than 50 characters'),
  
  body('courseName')
    .optional()
    .trim()
    .notEmpty().withMessage('Course name cannot be empty')
    .isLength({ max: 255 }).withMessage('Course name must be less than 255 characters'),
  
  body('department')
    .optional()
    .trim()
    .notEmpty().withMessage('Department cannot be empty')
    .isLength({ max: 100 }).withMessage('Department must be less than 100 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  body('classes')
    .optional()
    .isInt({ min: 0 }).withMessage('Classes must be a non-negative integer'),
  
  body('students')
    .optional()
    .isInt({ min: 0 }).withMessage('Students must be a non-negative integer'),
  
  body('quizzes')
    .optional()
    .isInt({ min: 0 }).withMessage('Quizzes must be a non-negative integer'),
  
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED']).withMessage('Status must be ACTIVE, INACTIVE, or ARCHIVED'),
  
  body('semester')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Semester must be less than 50 characters'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateStatusParam = [
  param('status')
    .trim()
    .toUpperCase()
    .isIn(['ACTIVE', 'INACTIVE', 'ARCHIVED']).withMessage('Status must be ACTIVE, INACTIVE, or ARCHIVED'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    req.params.status = req.params.status.toUpperCase();
    next();
  }
];