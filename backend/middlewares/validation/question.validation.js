// middlewares/validation/question.validation.js
import Joi from 'joi';

const questionValidation = {
  // Validation for creating a question
  create: (req, res, next) => {
    const baseSchema = Joi.object({
      questionText: Joi.string().required().min(3).max(5000),
      questionType: Joi.string().valid('multiple-choice', 'true-false', 'short-answer', 'essay').required(),
      course: Joi.string().required().max(100),
      difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
      points: Joi.number().integer().min(0).default(10),
      topic: Joi.string().max(200).allow(''),
      explanation: Joi.string().max(2000).allow(''),
      tags: Joi.array().items(Joi.string().max(50)).default([]),
      isTemplate: Joi.boolean().default(false),
      templateName: Joi.when('isTemplate', {
        is: true,
        then: Joi.string().required().max(100),
        otherwise: Joi.string().max(100).allow('')
      }),
      templateDescription: Joi.when('isTemplate', {
        is: true,
        then: Joi.string().max(500).allow(''),
        otherwise: Joi.string().max(500).allow('')
      })
    });

    // Multiple-choice specific validation
    const multipleChoiceSchema = baseSchema.append({
      multipleCorrect: Joi.boolean().default(false),
      options: Joi.array()
        .min(2)
        .max(10)
        .items(
          Joi.object({
            optionText: Joi.string().required().max(1000),
            isCorrect: Joi.boolean().default(false),
            explanation: Joi.string().max(500).allow('')
          })
        )
        .required(),
      correctBoolean: Joi.forbidden()
    });

    // True/False specific validation
    const trueFalseSchema = baseSchema.append({
      correctBoolean: Joi.boolean().required(),
      options: Joi.forbidden(),
      multipleCorrect: Joi.forbidden()
    });

    // Short-answer specific validation
    const shortAnswerSchema = baseSchema.append({
      correctAnswer: Joi.string().max(1000).allow(''),
      sampleAnswer: Joi.string().max(2000).allow(''),
      options: Joi.forbidden(),
      correctBoolean: Joi.forbidden(),
      multipleCorrect: Joi.forbidden()
    });

    // Essay specific validation
    const essaySchema = baseSchema.append({
      maxLength: Joi.number().integer().min(0),
      gradingRubric: Joi.array().items(
        Joi.object({
          criterion: Joi.string().required().max(200),
          points: Joi.number().integer().min(0).required(),
          description: Joi.string().max(500).allow('')
        })
      ),
      options: Joi.forbidden(),
      correctBoolean: Joi.forbidden(),
      multipleCorrect: Joi.forbidden(),
      correctAnswer: Joi.forbidden()
    });

    const { error } = validateByType(req.body, req.body.questionType);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for updating a question
  update: (req, res, next) => {
    const schema = Joi.object({
      questionText: Joi.string().min(3).max(5000),
      questionType: Joi.string().valid('multiple-choice', 'true-false', 'short-answer', 'essay'),
      course: Joi.string().max(100),
      difficulty: Joi.string().valid('easy', 'medium', 'hard'),
      points: Joi.number().integer().min(0),
      topic: Joi.string().max(200).allow(''),
      explanation: Joi.string().max(2000).allow(''),
      tags: Joi.array().items(Joi.string().max(50)),
      isTemplate: Joi.boolean(),
      templateName: Joi.string().max(100).allow(''),
      templateDescription: Joi.string().max(500).allow(''),
      options: Joi.array().items(
        Joi.object({
          id: Joi.string().uuid(),
          optionText: Joi.string().max(1000),
          isCorrect: Joi.boolean(),
          explanation: Joi.string().max(500).allow('')
        })
      ),
      correctBoolean: Joi.boolean(),
      correctAnswer: Joi.string().max(1000).allow(''),
      sampleAnswer: Joi.string().max(2000).allow(''),
      maxLength: Joi.number().integer().min(0),
      gradingRubric: Joi.array().items(
        Joi.object({
          id: Joi.string().uuid(),
          criterion: Joi.string().max(200),
          points: Joi.number().integer().min(0),
          description: Joi.string().max(500).allow('')
        })
      ),
      multipleCorrect: Joi.boolean()
    }).min(1); // At least one field to update

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for submitting answer
  submitAnswer: (req, res, next) => {
    const schema = Joi.object({
      answer: Joi.alternatives()
        .try(
          Joi.string(),
          Joi.boolean(),
          Joi.array().items(Joi.string())
        )
        .required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for batch answers
  submitBatchAnswers: (req, res, next) => {
    const schema = Joi.object({
      answers: Joi.array()
        .items(
          Joi.object({
            questionId: Joi.string().uuid().required(),
            answer: Joi.alternatives()
              .try(
                Joi.string(),
                Joi.boolean(),
                Joi.array().items(Joi.string())
              )
              .required()
          })
        )
        .min(1)
        .max(100)
        .required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for export
  export: (req, res, next) => {
    const schema = Joi.object({
      questionIds: Joi.array().items(Joi.string().uuid()),
      format: Joi.string().valid('csv', 'json', 'qti', 'pdf').default('json'),
      includeAnswers: Joi.boolean().default(false),
      includeExplanations: Joi.boolean().default(false),
      filters: Joi.object({
        course: Joi.string(),
        difficulty: Joi.string().valid('easy', 'medium', 'hard'),
        questionType: Joi.string().valid('multiple-choice', 'true-false', 'short-answer', 'essay'),
        tags: Joi.array().items(Joi.string()),
        createdAfter: Joi.date().iso(),
        createdBefore: Joi.date().iso()
      })
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for duplicate check
  checkDuplicate: (req, res, next) => {
    const schema = Joi.object({
      questionText: Joi.string().required().min(3).max(5000),
      course: Joi.string().max(100),
      threshold: Joi.number().min(0).max(1).default(0.8)
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for bulk update
  bulkUpdate: (req, res, next) => {
    const schema = Joi.object({
      questionIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required(),
      updates: Joi.object({
        course: Joi.string().max(100),
        difficulty: Joi.string().valid('easy', 'medium', 'hard'),
        points: Joi.number().integer().min(0),
        topic: Joi.string().max(200).allow(''),
        isActive: Joi.boolean(),
        tags: Joi.object({
          add: Joi.array().items(Joi.string().max(50)),
          remove: Joi.array().items(Joi.string().max(50))
        })
      }).min(1).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for sharing question
  share: (req, res, next) => {
    const schema = Joi.object({
      userIds: Joi.array().items(Joi.string().uuid()).min(1).max(50).required(),
      permission: Joi.string().valid('view', 'edit', 'duplicate').default('view'),
      expiresAt: Joi.date().iso().greater('now')
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for feedback
  feedback: (req, res, next) => {
    const schema = Joi.object({
      rating: Joi.number().integer().min(1).max(5),
      comment: Joi.string().max(1000).required(),
      type: Joi.string().valid('typo', 'clarification', 'suggestion', 'error', 'other').default('suggestion')
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for rating difficulty
  rateDifficulty: (req, res, next) => {
    const schema = Joi.object({
      difficulty: Joi.string().valid('too-easy', 'appropriate', 'too-hard').required(),
      comment: Joi.string().max(500).allow('')
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  },

  // Validation for webhook create
  webhookCreate: (req, res, next) => {
    const schema = Joi.object({
      apiKey: Joi.string().required(),
      questions: Joi.array()
        .items(
          Joi.object({
            questionText: Joi.string().required(),
            questionType: Joi.string().valid('multiple-choice', 'true-false', 'short-answer', 'essay').required(),
            course: Joi.string().required(),
            difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
            points: Joi.number().integer().min(0).default(10)
          })
        )
        .min(1)
        .max(50)
        .required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    next();
  }
};

// Helper function to validate by question type
function validateByType(data, questionType) {
  let schema;
  
  switch (questionType) {
    case 'multiple-choice':
      schema = questionValidation.create.schema.options[0].then;
      break;
    case 'true-false':
      schema = questionValidation.create.schema.options[1].then;
      break;
    case 'short-answer':
      schema = questionValidation.create.schema.options[2].then;
      break;
    case 'essay':
      schema = questionValidation.create.schema.options[3].then;
      break;
    default:
      return { error: { details: [{ message: 'Invalid question type' }] } };
  }
  
  return schema.validate(data);
}

export default questionValidation;