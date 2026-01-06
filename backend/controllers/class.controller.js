// controllers/class.controller.js
import { Class, ClassStudent, Course, User } from '../models/associationClass.js';

export const classController = {
  // Create a new class
  createClass: async (req, res) => {
    try {
      const {
        name,
        description,
        courseId,
        group,
        academicYear,
        semester,
        maxStudents,
        schedule,
        location,
        instructorId,
        startDate,
        endDate
      } = req.body;

      // Generate class code
      const course = await Course.findByPk(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const classCount = await Class.count({ where: { courseId, group } });
      const classCode = `${course.code}-${group}-${academicYear.substring(2)}`;

      const newClass = await Class.create({
        classCode,
        name,
        description,
        courseId,
        group,
        academicYear,
        semester,
        maxStudents: parseInt(maxStudents),
        schedule: schedule || {},
        location,
        instructorId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active'
      });

      const classWithDetails = await Class.findByPk(newClass.id, {
        include: [
          { model: Course, as: 'course' },
          { model: User, as: 'instructor' }
        ]
      });

      res.status(201).json(classWithDetails);
    } catch (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ error: 'Failed to create class' });
    }
  },

  // Get all classes
  getAllClasses: async (req, res) => {
    try {
      const { 
        courseId, 
        instructorId, 
        academicYear, 
        semester, 
        status,
        group,
        studentId 
      } = req.query;

      const where = {};
      const include = [
        { model: Course, as: 'course' },
        { model: User, as: 'instructor' }
      ];

      if (courseId) where.courseId = courseId;
      if (instructorId) where.instructorId = instructorId;
      if (academicYear) where.academicYear = academicYear;
      if (semester) where.semester = semester;
      if (status) where.status = status;
      if (group) where.group = group;

      // If studentId is provided, filter classes where student is enrolled
      if (studentId) {
        include.push({
          model: ClassStudent,
          as: 'students',
          where: { studentId },
          required: true
        });
      }

      const classes = await Class.findAll({
        where,
        include,
        order: [
          ['academicYear', 'DESC'],
          ['semester', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      // Calculate statistics
      const totalClasses = await Class.count();
      const activeClasses = await Class.count({ where: { status: 'active' }});
      const upcomingClasses = await Class.count({ 
        where: { 
          status: 'active',
          startDate: { [Op.gt]: new Date() }
        }
      });

      res.json({
        classes,
        statistics: {
          totalClasses,
          activeClasses,
          upcomingClasses
        }
      });
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  },

  // Get class by ID
  getClassById: async (req, res) => {
    try {
      const { id } = req.params;

      const classItem = await Class.findByPk(id, {
        include: [
          { model: Course, as: 'course' },
          { model: User, as: 'instructor' },
          { 
            model: ClassStudent, 
            as: 'students',
            include: [{ model: User, as: 'student' }]
          },
          {
            model: QuizClass,
            as: 'quizzes',
            include: [{ model: Quiz, as: 'quiz' }]
          }
        ]
      });

      if (!classItem) {
        return res.status(404).json({ error: 'Class not found' });
      }

      res.json(classItem);
    } catch (error) {
      console.error('Error fetching class:', error);
      res.status(500).json({ error: 'Failed to fetch class' });
    }
  },

  // Update class
  updateClass: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const classItem = await Class.findByPk(id);
      if (!classItem) {
        return res.status(404).json({ error: 'Class not found' });
      }

      await classItem.update(updates);

      const updatedClass = await Class.findByPk(id, {
        include: [
          { model: Course, as: 'course' },
          { model: User, as: 'instructor' }
        ]
      });

      res.json(updatedClass);
    } catch (error) {
      console.error('Error updating class:', error);
      res.status(500).json({ error: 'Failed to update class' });
    }
  },

  // Delete class
  deleteClass: async (req, res) => {
    try {
      const { id } = req.params;

      const classItem = await Class.findByPk(id);
      if (!classItem) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Check if class has students
      const studentCount = await ClassStudent.count({ where: { classId: id } });
      if (studentCount > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete class with enrolled students. Remove students first.' 
        });
      }

      // Delete related records
      await QuizClass.destroy({ where: { classId: id } });
      
      // Delete class
      await classItem.destroy();

      res.json({ message: 'Class deleted successfully' });
    } catch (error) {
      console.error('Error deleting class:', error);
      res.status(500).json({ error: 'Failed to delete class' });
    }
  },

  // Enroll student in class
  enrollStudent: async (req, res) => {
    try {
      const { classId } = req.params;
      const { studentId } = req.body;

      const classItem = await Class.findByPk(classId);
      if (!classItem) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Check if class is full
      if (classItem.currentStudents >= classItem.maxStudents) {
        return res.status(400).json({ error: 'Class is full' });
      }

      // Check if student is already enrolled
      const existingEnrollment = await ClassStudent.findOne({
        where: { classId, studentId }
      });

      if (existingEnrollment) {
        return res.status(400).json({ error: 'Student already enrolled in this class' });
      }

      // Create enrollment
      const enrollment = await ClassStudent.create({
        classId,
        studentId,
        enrollmentDate: new Date(),
        enrollmentStatus: 'enrolled'
      });

      // Update student count
      await classItem.update({
        currentStudents: classItem.currentStudents + 1
      });

      const enrollmentWithDetails = await ClassStudent.findByPk(enrollment.id, {
        include: [
          { model: Class, as: 'class' },
          { model: User, as: 'student' }
        ]
      });

      res.status(201).json(enrollmentWithDetails);
    } catch (error) {
      console.error('Error enrolling student:', error);
      res.status(500).json({ error: 'Failed to enroll student' });
    }
  },

  // Remove student from class
  removeStudent: async (req, res) => {
    try {
      const { classId, studentId } = req.params;

      const enrollment = await ClassStudent.findOne({
        where: { classId, studentId }
      });

      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      // Delete enrollment
      await enrollment.destroy();

      // Update student count
      const classItem = await Class.findByPk(classId);
      if (classItem) {
        await classItem.update({
          currentStudents: Math.max(0, classItem.currentStudents - 1)
        });
      }

      res.json({ message: 'Student removed from class successfully' });
    } catch (error) {
      console.error('Error removing student:', error);
      res.status(500).json({ error: 'Failed to remove student from class' });
    }
  },

  // Get class students
  getClassStudents: async (req, res) => {
    try {
      const { classId } = req.params;
      const { enrollmentStatus } = req.query;

      const where = { classId };
      if (enrollmentStatus) where.enrollmentStatus = enrollmentStatus;

      const students = await ClassStudent.findAll({
        where,
        include: [
          { model: User, as: 'student' },
          { model: Class, as: 'class' }
        ],
        order: [['enrollmentDate', 'ASC']]
      });

      res.json(students);
    } catch (error) {
      console.error('Error fetching class students:', error);
      res.status(500).json({ error: 'Failed to fetch class students' });
    }
  },

  // Update student enrollment status
  updateStudentEnrollment: async (req, res) => {
    try {
      const { classId, studentId } = req.params;
      const { enrollmentStatus, grade, attendance, notes } = req.body;

      const enrollment = await ClassStudent.findOne({
        where: { classId, studentId }
      });

      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      await enrollment.update({
        enrollmentStatus,
        grade,
        attendance,
        notes
      });

      const updatedEnrollment = await ClassStudent.findByPk(enrollment.id, {
        include: [
          { model: User, as: 'student' },
          { model: Class, as: 'class' }
        ]
      });

      res.json(updatedEnrollment);
    } catch (error) {
      console.error('Error updating student enrollment:', error);
      res.status(500).json({ error: 'Failed to update student enrollment' });
    }
  },

  // Get student's enrolled classes
  getStudentClasses: async (req, res) => {
    try {
      const { studentId } = req.params;
      const { enrollmentStatus, academicYear, semester } = req.query;

      const where = { studentId };
      const include = [
        { 
          model: Class, 
          as: 'class',
          include: [
            { model: Course, as: 'course' },
            { model: User, as: 'instructor' }
          ]
        }
      ];

      if (enrollmentStatus) where.enrollmentStatus = enrollmentStatus;

      if (academicYear) {
        include[0].where = { academicYear };
      }

      if (semester) {
        include[0].where = { ...include[0].where, semester };
      }

      const enrollments = await ClassStudent.findAll({
        where,
        include,
        order: [[{ model: Class, as: 'class' }, 'startDate', 'DESC']]
      });

      const classes = enrollments.map(enrollment => ({
        ...enrollment.class.toJSON(),
        enrollmentStatus: enrollment.enrollmentStatus,
        grade: enrollment.grade,
        attendance: enrollment.attendance
      }));

      res.json(classes);
    } catch (error) {
      console.error('Error fetching student classes:', error);
      res.status(500).json({ error: 'Failed to fetch student classes' });
    }
  },

  // Get instructor's classes
  getInstructorClasses: async (req, res) => {
    try {
      const { instructorId } = req.params;
      const { academicYear, semester, status } = req.query;

      const where = { instructorId };
      if (academicYear) where.academicYear = academicYear;
      if (semester) where.semester = semester;
      if (status) where.status = status;

      const classes = await Class.findAll({
        where,
        include: [
          { model: Course, as: 'course' },
          { model: ClassStudent, as: 'students' }
        ],
        order: [
          ['academicYear', 'DESC'],
          ['semester', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      res.json(classes);
    } catch (error) {
      console.error('Error fetching instructor classes:', error);
      res.status(500).json({ error: 'Failed to fetch instructor classes' });
    }
  },

  // Get class statistics
  getClassStatistics: async (req, res) => {
    try {
      const { classId } = req.params;

      const classItem = await Class.findByPk(classId, {
        include: [
          { model: ClassStudent, as: 'students' }
        ]
      });

      if (!classItem) {
        return res.status(404).json({ error: 'Class not found' });
      }

      const students = classItem.students;
      const enrolledStudents = students.filter(s => s.enrollmentStatus === 'enrolled').length;
      const completedStudents = students.filter(s => s.enrollmentStatus === 'completed').length;

      // Calculate average grade
      const gradedStudents = students.filter(s => s.grade !== null);
      const averageGrade = gradedStudents.length > 0
        ? gradedStudents.reduce((sum, s) => sum + s.grade, 0) / gradedStudents.length
        : 0;

      // Calculate average attendance
      const averageAttendance = students.length > 0
        ? students.reduce((sum, s) => sum + s.attendance, 0) / students.length
        : 0;

      // Get grade distribution
      const gradeDistribution = {
        A: students.filter(s => s.grade >= 90).length,
        B: students.filter(s => s.grade >= 80 && s.grade < 90).length,
        C: students.filter(s => s.grade >= 70 && s.grade < 80).length,
        D: students.filter(s => s.grade >= 60 && s.grade < 70).length,
        F: students.filter(s => s.grade < 60).length
      };

      res.json({
        totalStudents: students.length,
        enrolledStudents,
        completedStudents,
        averageGrade: parseFloat(averageGrade.toFixed(2)),
        averageAttendance: parseFloat(averageAttendance.toFixed(1)),
        gradeDistribution,
        capacity: {
          current: classItem.currentStudents,
          max: classItem.maxStudents,
          percentage: (classItem.currentStudents / classItem.maxStudents) * 100
        }
      });
    } catch (error) {
      console.error('Error fetching class statistics:', error);
      res.status(500).json({ error: 'Failed to fetch class statistics' });
    }
  }
};

