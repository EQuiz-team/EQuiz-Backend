// models/index.js
import Class from './class.model.js';
import ClassStudent from './classStudent.model.js';
import Course from './course.model.js';
import User from './user.model.js';
import Quiz from './quiz.model.js';
import QuizClass from './quizClass.model.js';

// Class associations
Class.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Class.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
Class.hasMany(ClassStudent, { foreignKey: 'classId', as: 'students' });
Class.hasMany(QuizClass, { foreignKey: 'classId', as: 'quizzes' });

// ClassStudent associations
ClassStudent.belongsTo(Class, { foreignKey: 'classId', as: 'class' });
ClassStudent.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Course associations
Course.hasMany(Class, { foreignKey: 'courseId', as: 'courseClasses' });

// User associations (if not already present)
User.hasMany(Class, { foreignKey: 'teacherId', as: 'instructedClasses' });
User.hasMany(ClassStudent, { foreignKey: 'studentId', as: 'enrolledClasses' });

// QuizClass associations
QuizClass.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

export {
  Class,
  ClassStudent,
  Course,
  User,
  Quiz,
  QuizClass
};