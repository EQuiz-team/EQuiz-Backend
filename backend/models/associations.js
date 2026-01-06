// models/index.js or models/associations.js
import Question from './question.model.js';
import Option from './option.model.js';
import RubricCriteria from './rubricCriteria.model.js';
import Tag from './tag.model.js';
import QuestionTag from './questionTag.model.js';

// Question has many Options (1:N)
Question.hasMany(Option, {
  foreignKey: 'questionId',
  as: 'options',
  onDelete: 'CASCADE'
});
Option.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question'
});

// Question has many RubricCriteria (1:N)
Question.hasMany(RubricCriteria, {
  foreignKey: 'questionId',
  as: 'gradingRubric',
  onDelete: 'CASCADE'
});
RubricCriteria.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question'
});

// Question belongs to many Tags (N:M)
Question.belongsToMany(Tag, {
  through: QuestionTag,
  foreignKey: 'questionId',
  otherKey: 'tagId',
  as: 'tags'
});
Tag.belongsToMany(Question, {
  through: QuestionTag,
  foreignKey: 'tagId',
  otherKey: 'questionId',
  as: 'questions'
});

// QuestionTag associations
QuestionTag.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question'
});
QuestionTag.belongsTo(Tag, {
  foreignKey: 'tagId',
  as: 'tag'
});

// Add instance methods to Question model
Question.prototype.validateQuestion = function() {
  const errors = [];
  
  if (!this.questionText || this.questionText.trim() === '') {
    errors.push('Question text is required');
  }
  
  if (this.points <= 0) {
    errors.push('Points must be greater than 0');
  }
  
  return errors;
};

Question.prototype.checkAnswer = async function(userAnswer) {
  switch (this.questionType) {
    case 'multiple-choice':
      const options = await this.getOptions();
      const correctOptions = options.filter(opt => opt.isCorrect);
      
      if (this.multipleCorrect) {
        if (!Array.isArray(userAnswer)) return false;
        
        const correctOptionIds = correctOptions.map(opt => opt.id);
        return userAnswer.every(ans => correctOptionIds.includes(ans)) && 
               userAnswer.length === correctOptionIds.length;
      } else {
        if (Array.isArray(userAnswer) || !userAnswer) return false;
        const correctOption = correctOptions.find(opt => opt.id === userAnswer);
        return !!correctOption;
      }
      
    case 'true-false':
      return userAnswer === this.correctBoolean;
      
    case 'short-answer':
      return this.correctAnswer && 
             this.correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
      
    case 'essay':
      return null; // Requires manual grading
      
    default:
      return false;
  }
};

// Static method to create from template
Question.createFromTemplate = async function(templateId, overrideData, createdBy) {
  const template = await Question.findByPk(templateId, {
    include: [
      { model: Option, as: 'options' },
      { model: RubricCriteria, as: 'gradingRubric' },
      { model: Tag, as: 'tags' }
    ]
  });
  
  if (!template || !template.isTemplate) {
    throw new Error('Template not found or not marked as template');
  }
  
  // Create new question data
  const questionData = {
    questionText: template.questionText,
    questionType: template.questionType,
    multipleCorrect: template.multipleCorrect,
    correctBoolean: template.correctBoolean,
    correctAnswer: template.correctAnswer,
    sampleAnswer: template.sampleAnswer,
    maxLength: template.maxLength,
    course: template.course,
    difficulty: template.difficulty,
    points: template.points,
    topic: template.topic,
    explanation: template.explanation,
    isTemplate: false,
    createdBy: createdBy,
    isActive: true
  };
  
  // Apply overrides
  Object.assign(questionData, overrideData);
  
  const question = await Question.create(questionData);
  
  // Copy options if needed
  if (template.questionType === 'multiple-choice' && template.options) {
    const options = template.options.map(opt => ({
      questionId: question.id,
      optionText: opt.optionText,
      isCorrect: opt.isCorrect,
      explanation: opt.explanation,
      order: opt.order
    }));
    await Option.bulkCreate(options);
  }
  
  // Copy rubric criteria if needed
  if (template.questionType === 'essay' && template.gradingRubric) {
    const rubricCriteria = template.gradingRubric.map(criteria => ({
      questionId: question.id,
      criterion: criteria.criterion,
      points: criteria.points,
      description: criteria.description,
      order: criteria.order
    }));
    await RubricCriteria.bulkCreate(rubricCriteria);
  }
  
  // Copy tags if needed
  if (template.tags && template.tags.length > 0) {
    const tagIds = template.tags.map(tag => tag.id);
    await question.addTags(tagIds);
  }
  
  return question;
};

export {
  Question,
  Option,
  RubricCriteria,
  Tag,
  QuestionTag
};