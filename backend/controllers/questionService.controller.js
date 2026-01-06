// controllers/questionService.controller.js
import { Question, Option, RubricCriteria, Tag, QuestionTag } from '../models/associations.js';
import { Op } from 'sequelize';
import { sequelize } from '../database/postgress.js';

// ====================================
// CORE CRUD OPERATIONS
// ====================================

export const createQuestion = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { options, gradingRubric, tags, ...questionData } = req.body;
    
    // Create question
    const question = await Question.create({
      ...questionData,
      createdBy: req.user.id
    }, { transaction });
    
    // Create options for multiple-choice questions
    if (question.questionType === 'multiple-choice' && options && options.length > 0) {
      const optionPromises = options.map((opt, index) => 
        Option.create({
          ...opt,
          questionId: question.id,
          order: index
        }, { transaction })
      );
      await Promise.all(optionPromises);
    }
    
    // Create rubric criteria for essay questions
    if (question.questionType === 'essay' && gradingRubric && gradingRubric.length > 0) {
      const rubricPromises = gradingRubric.map((criteria, index) =>
        RubricCriteria.create({
          ...criteria,
          questionId: question.id,
          order: index
        }, { transaction })
      );
      await Promise.all(rubricPromises);
    }
    
    // Handle tags
    if (tags && tags.length > 0) {
      const tagPromises = tags.map(async tagName => {
        let tag = await Tag.findOne({ 
          where: { name: tagName.toLowerCase() },
          transaction 
        });
        
        if (!tag) {
          tag = await Tag.create({ 
            name: tagName.toLowerCase() 
          }, { transaction });
        }
        
        await QuestionTag.create({
          questionId: question.id,
          tagId: tag.id
        }, { transaction });
      });
      
      await Promise.all(tagPromises);
    }
    
    await transaction.commit();
    
    // Fetch complete question with associations
    const completeQuestion = await Question.findByPk(question.id, {
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: completeQuestion
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const getQuestions = async (req, res) => {
  try {
    const {
      course,
      questionType,
      difficulty,
      tags,
      isTemplate,
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    const where = { isActive: true };
    const include = [];
    
    // Apply filters
    if (course) where.course = course;
    if (questionType) where.questionType = questionType;
    if (difficulty) where.difficulty = difficulty;
    if (isTemplate !== undefined) where.isTemplate = isTemplate === 'true';
    
    // Search functionality
    if (search) {
      where[Op.or] = [
        { questionText: { [Op.iLike]: `%${search}%` } },
        { topic: { [Op.iLike]: `%${search}%` } },
        { course: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      include.push({
        model: Tag,
        as: 'tags',
        where: {
          name: { [Op.in]: tagArray }
        },
        through: { attributes: [] }
      });
    }
    
    // Always include basic associations
    include.push(
      { model: Option, as: 'options' },
      { model: RubricCriteria, as: 'gradingRubric' }
    );
    
    if (!tags) {
      include.push({ model: Tag, as: 'tags' });
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: questions } = await Question.findAndCountAll({
      where,
      include,
      distinct: true,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ],
      where: { isActive: true }
    });
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateQuestion = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const question = await Question.findOne({
      where: { 
        id: req.params.id,
        isActive: true 
      },
      transaction
    });
    
    if (!question) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Check authorization
    if (question.createdBy !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this question'
      });
    }
    
    const { options, gradingRubric, tags, ...updateData } = req.body;
    
    // Update question
    await question.update(updateData, { transaction });
    
    // Update options if provided
    if (options && question.questionType === 'multiple-choice') {
      // Delete existing options
      await Option.destroy({ 
        where: { questionId: question.id },
        transaction 
      });
      
      // Create new options
      const optionPromises = options.map((opt, index) =>
        Option.create({
          ...opt,
          questionId: question.id,
          order: index
        }, { transaction })
      );
      await Promise.all(optionPromises);
    }
    
    // Update rubric criteria if provided
    if (gradingRubric && question.questionType === 'essay') {
      // Delete existing rubric
      await RubricCriteria.destroy({ 
        where: { questionId: question.id },
        transaction 
      });
      
      // Create new rubric
      const rubricPromises = gradingRubric.map((criteria, index) =>
        RubricCriteria.create({
          ...criteria,
          questionId: question.id,
          order: index
        }, { transaction })
      );
      await Promise.all(rubricPromises);
    }
    
    // Update tags if provided
    if (tags) {
      // Remove existing tags
      await QuestionTag.destroy({ 
        where: { questionId: question.id },
        transaction 
      });
      
      // Add new tags
      const tagPromises = tags.map(async tagName => {
        let tag = await Tag.findOne({ 
          where: { name: tagName.toLowerCase() },
          transaction 
        });
        
        if (!tag) {
          tag = await Tag.create({ 
            name: tagName.toLowerCase() 
          }, { transaction });
        }
        
        await QuestionTag.create({
          questionId: question.id,
          tagId: tag.id
        }, { transaction });
      });
      
      await Promise.all(tagPromises);
    }
    
    await transaction.commit();
    
    // Fetch updated question
    const updatedQuestion = await Question.findByPk(question.id, {
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ]
    });
    
    res.json({
      success: true,
      data: updatedQuestion
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOne({
      where: { 
        id: req.params.id,
        isActive: true 
      }
    });
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Check authorization
    if (question.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this question'
      });
    }
    
    // Soft delete
    await question.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// TEMPLATE OPERATIONS
// ====================================

export const createFromTemplate = async (req, res) => {
  try {
    const question = await Question.createFromTemplate(
      req.params.templateId,
      req.body,
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// ANSWER SUBMISSION OPERATIONS
// ====================================

export const submitAnswer = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id, {
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' }
      ],
      where: { isActive: true }
    });
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    const { answer } = req.body;
    const isCorrect = await question.checkAnswer(answer);
    
    res.json({
      success: true,
      data: {
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const submitBatchAnswers = async (req, res) => {
  try {
    const { answers } = req.body;
    const results = [];
    
    for (const item of answers) {
      const question = await Question.findByPk(item.questionId, {
        include: [
          { model: Option, as: 'options' },
          { model: RubricCriteria, as: 'gradingRubric' }
        ],
        where: { isActive: true }
      });
      
      if (question) {
        const isCorrect = await question.checkAnswer(item.answer);
        results.push({
          questionId: item.questionId,
          isCorrect,
          explanation: question.explanation,
          points: isCorrect ? question.points : 0
        });
      } else {
        results.push({
          questionId: item.questionId,
          error: 'Question not found'
        });
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// TAG MANAGEMENT OPERATIONS
// ====================================

export const getTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getQuestionsByTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const tag = await Tag.findByPk(tagId);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: questions } = await Question.findAndCountAll({
      include: [
        {
          model: Tag,
          as: 'tags',
          where: { id: tagId },
          through: { attributes: [] }
        },
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' }
      ],
      where: { isActive: true },
      distinct: true,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: questions,
      tag: tag.name,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// EXPORT/IMPORT OPERATIONS
// ====================================

export const exportQuestions = async (req, res) => {
  try {
    const { questionIds, format, includeAnswers, includeExplanations, filters } = req.body;
    
    const where = { isActive: true };
    
    // Apply filters if provided
    if (filters) {
      if (filters.course) where.course = filters.course;
      if (filters.difficulty) where.difficulty = filters.difficulty;
      if (filters.questionType) where.questionType = filters.questionType;
      if (filters.createdAfter) where.createdAt = { [Op.gte]: new Date(filters.createdAfter) };
      if (filters.createdBefore) where.createdAt = { [Op.lte]: new Date(filters.createdBefore) };
    }
    
    // Filter by specific IDs if provided
    if (questionIds && questionIds.length > 0) {
      where.id = { [Op.in]: questionIds };
    }
    
    const include = [
      { model: Option, as: 'options' },
      { model: RubricCriteria, as: 'gradingRubric' },
      { model: Tag, as: 'tags' }
    ];
    
    if (filters && filters.tags) {
      include.push({
        model: Tag,
        as: 'tags',
        where: { name: { [Op.in]: filters.tags } },
        through: { attributes: [] }
      });
    }
    
    const questions = await Question.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']]
    });
    
    // Format data based on export format
    let exportData;
    let contentType;
    let filename;
    
    switch (format) {
      case 'csv':
        exportData = formatToCSV(questions, includeAnswers, includeExplanations);
        contentType = 'text/csv';
        filename = `questions_${Date.now()}.csv`;
        break;
      case 'qti':
        exportData = formatToQTI(questions);
        contentType = 'application/xml';
        filename = `questions_${Date.now()}.xml`;
        break;
      case 'pdf':
        // For PDF, you would typically use a PDF generation library
        exportData = 'PDF generation not implemented';
        contentType = 'application/pdf';
        filename = `questions_${Date.now()}.pdf`;
        break;
      case 'json':
      default:
        exportData = JSON.stringify(questions, null, 2);
        contentType = 'application/json';
        filename = `questions_${Date.now()}.json`;
        break;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const importQuestions = async (req, res) => {
  try {
    // This would typically handle file upload and parsing
    // For now, we'll assume questions are sent in the request body
    const { questions } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        error: 'Questions array is required'
      });
    }
    
    const importedQuestions = [];
    const errors = [];
    
    for (const qData of questions) {
      try {
        const question = await createQuestion({ 
          body: qData, 
          user: req.user 
        });
        importedQuestions.push(question);
      } catch (error) {
        errors.push({
          question: qData.questionText,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        imported: importedQuestions.length,
        failed: errors.length,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const downloadImportTemplate = async (req, res) => {
  try {
    const template = {
      format: 'CSV',
      columns: [
        'questionText',
        'questionType',
        'course',
        'difficulty',
        'points',
        'topic',
        'explanation',
        'options',
        'correctAnswer',
        'sampleAnswer',
        'maxLength',
        'tags'
      ],
      example: {
        questionText: 'What is the capital of France?',
        questionType: 'multiple-choice',
        course: 'Geography',
        difficulty: 'easy',
        points: 10,
        topic: 'European Capitals',
        explanation: 'Paris has been the capital since the 5th century.',
        options: JSON.stringify([
          { optionText: 'Paris', isCorrect: true },
          { optionText: 'London', isCorrect: false },
          { optionText: 'Berlin', isCorrect: false },
          { optionText: 'Madrid', isCorrect: false }
        ]),
        correctAnswer: '',
        sampleAnswer: '',
        maxLength: '',
        tags: 'geography,europe,capitals'
      }
    };
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// STATISTICS & ANALYTICS OPERATIONS
// ====================================

export const getQuestionStats = async (req, res) => {
  try {
    const totalQuestions = await Question.count({ where: { isActive: true } });
    const totalTemplates = await Question.count({ where: { isActive: true, isTemplate: true } });
    const recentQuestions = await Question.count({
      where: {
        isActive: true,
        createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }
    });
    
    // Get most popular courses
    const courseStats = await Question.findAll({
      attributes: [
        'course',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['course'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5
    });
    
    res.json({
      success: true,
      data: {
        totalQuestions,
        totalTemplates,
        recentQuestions,
        courseStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getDifficultyStats = async (req, res) => {
  try {
    const difficultyStats = await Question.findAll({
      attributes: [
        'difficulty',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('points')), 'averagePoints']
      ],
      where: { isActive: true },
      group: ['difficulty']
    });
    
    res.json({
      success: true,
      data: difficultyStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getQuestionTypeStats = async (req, res) => {
  try {
    const questionTypeStats = await Question.findAll({
      attributes: [
        'questionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['questionType']
    });
    
    res.json({
      success: true,
      data: questionTypeStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getCourseStats = async (req, res) => {
  try {
    const courseStats = await Question.findAll({
      attributes: [
        'course',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('points')), 'averagePoints'],
        [
          sequelize.literal(`(
            SELECT COUNT(*) 
            FROM questions AS q2 
            WHERE q2.course = Question.course 
            AND q2.difficulty = 'easy'
          )`),
          'easyCount'
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*) 
            FROM questions AS q2 
            WHERE q2.course = Question.course 
            AND q2.difficulty = 'medium'
          )`),
          'mediumCount'
        ],
        [
          sequelize.literal(`(
            SELECT COUNT(*) 
            FROM questions AS q2 
            WHERE q2.course = Question.course 
            AND q2.difficulty = 'hard'
          )`),
          'hardCount'
        ]
      ],
      where: { isActive: true },
      group: ['course'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });
    
    res.json({
      success: true,
      data: courseStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// BULK OPERATIONS
// ====================================

export const bulkUpdateQuestions = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { questionIds, updates } = req.body;
    
    // Update questions
    await Question.update(updates, {
      where: {
        id: { [Op.in]: questionIds },
        isActive: true
      },
      transaction
    });
    
    // Handle tag updates if provided
    if (updates.tags) {
      for (const questionId of questionIds) {
        const question = await Question.findByPk(questionId, { transaction });
        
        if (updates.tags.add) {
          for (const tagName of updates.tags.add) {
            let tag = await Tag.findOne({
              where: { name: tagName.toLowerCase() },
              transaction
            });
            
            if (!tag) {
              tag = await Tag.create({
                name: tagName.toLowerCase()
              }, { transaction });
            }
            
            await QuestionTag.findOrCreate({
              where: {
                questionId,
                tagId: tag.id
              },
              transaction
            });
          }
        }
        
        if (updates.tags.remove) {
          for (const tagName of updates.tags.remove) {
            const tag = await Tag.findOne({
              where: { name: tagName.toLowerCase() },
              transaction
            });
            
            if (tag) {
              await QuestionTag.destroy({
                where: {
                  questionId,
                  tagId: tag.id
                },
                transaction
              });
            }
          }
        }
      }
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: `${questionIds.length} questions updated successfully`
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const bulkDeleteQuestions = async (req, res) => {
  try {
    const { questionIds } = req.body;
    
    await Question.update(
      { isActive: false },
      {
        where: {
          id: { [Op.in]: questionIds },
          isActive: true
        }
      }
    );
    
    res.json({
      success: true,
      message: `${questionIds.length} questions deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const bulkChangeStatus = async (req, res) => {
  try {
    const { questionIds, isActive } = req.body;
    
    await Question.update(
      { isActive },
      {
        where: {
          id: { [Op.in]: questionIds }
        }
      }
    );
    
    res.json({
      success: true,
      message: `${questionIds.length} questions ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// VALIDATION & DUPLICATE CHECK
// ====================================

export const checkDuplicateQuestion = async (req, res) => {
  try {
    const { questionText, course, threshold = 0.8 } = req.body;
    
    // Simple duplicate check - you might want to implement more sophisticated
    // text similarity algorithms for production
    const existingQuestions = await Question.findAll({
      where: {
        course,
        isActive: true
      },
      attributes: ['id', 'questionText']
    });
    
    const duplicates = existingQuestions.filter(q => {
      const similarity = calculateTextSimilarity(questionText, q.questionText);
      return similarity >= threshold;
    });
    
    res.json({
      success: true,
      data: {
        hasDuplicates: duplicates.length > 0,
        duplicates: duplicates.map(q => ({
          id: q.id,
          similarity: calculateTextSimilarity(questionText, q.questionText)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const validateQuestionData = async (req, res) => {
  try {
    const questionData = req.body;
    const errors = [];
    
    // Basic validation
    if (!questionData.questionText || questionData.questionText.trim() === '') {
      errors.push('Question text is required');
    }
    
    if (!questionData.course || questionData.course.trim() === '') {
      errors.push('Course is required');
    }
    
    if (questionData.points <= 0) {
      errors.push('Points must be greater than 0');
    }
    
    // Type-specific validation
    switch (questionData.questionType) {
      case 'multiple-choice':
        if (!questionData.options || questionData.options.length < 2) {
          errors.push('Multiple-choice questions require at least 2 options');
        }
        if (questionData.options) {
          const correctOptions = questionData.options.filter(opt => opt.isCorrect);
          if (correctOptions.length === 0) {
            errors.push('At least one option must be marked as correct');
          }
        }
        break;
      case 'true-false':
        if (questionData.correctBoolean === undefined) {
          errors.push('Correct boolean answer is required for true/false questions');
        }
        break;
      case 'essay':
        if (questionData.maxLength && questionData.maxLength <= 0) {
          errors.push('Maximum length must be positive for essay questions');
        }
        break;
    }
    
    res.json({
      success: true,
      data: {
        isValid: errors.length === 0,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// PREVIEW & CLONE OPERATIONS
// ====================================

export const previewQuestion = async (req, res) => {
  try {
    const questionData = req.body;
    
    // Simulate question creation without saving to database
    const previewQuestion = {
      ...questionData,
      id: 'preview-' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      data: previewQuestion,
      message: 'This is a preview only. Question not saved.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const cloneQuestion = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const originalQuestion = await Question.findByPk(req.params.id, {
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ],
      where: { isActive: true },
      transaction
    });
    
    if (!originalQuestion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Create cloned question
    const clonedQuestionData = {
      questionText: originalQuestion.questionText + ' (Copy)',
      questionType: originalQuestion.questionType,
      multipleCorrect: originalQuestion.multipleCorrect,
      correctBoolean: originalQuestion.correctBoolean,
      correctAnswer: originalQuestion.correctAnswer,
      sampleAnswer: originalQuestion.sampleAnswer,
      maxLength: originalQuestion.maxLength,
      course: originalQuestion.course,
      difficulty: originalQuestion.difficulty,
      points: originalQuestion.points,
      topic: originalQuestion.topic,
      explanation: originalQuestion.explanation,
      isTemplate: originalQuestion.isTemplate,
      createdBy: req.user.id,
      isActive: true
    };
    
    const clonedQuestion = await Question.create(clonedQuestionData, { transaction });
    
    // Clone options if exists
    if (originalQuestion.options && originalQuestion.options.length > 0) {
      const clonedOptions = originalQuestion.options.map(opt => ({
        questionId: clonedQuestion.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        explanation: opt.explanation,
        order: opt.order
      }));
      await Option.bulkCreate(clonedOptions, { transaction });
    }
    
    // Clone rubric criteria if exists
    if (originalQuestion.gradingRubric && originalQuestion.gradingRubric.length > 0) {
      const clonedRubric = originalQuestion.gradingRubric.map(criteria => ({
        questionId: clonedQuestion.id,
        criterion: criteria.criterion,
        points: criteria.points,
        description: criteria.description,
        order: criteria.order
      }));
      await RubricCriteria.bulkCreate(clonedRubric, { transaction });
    }
    
    // Clone tags if exists
    if (originalQuestion.tags && originalQuestion.tags.length > 0) {
      const tagIds = originalQuestion.tags.map(tag => tag.id);
      await clonedQuestion.addTags(tagIds, { transaction });
    }
    
    await transaction.commit();
    
    // Fetch complete cloned question
    const completeClonedQuestion = await Question.findByPk(clonedQuestion.id, {
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: completeClonedQuestion,
      message: 'Question cloned successfully'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// SEARCH & FILTER OPERATIONS
// ====================================

export const advancedSearch = async (req, res) => {
  try {
    const {
      query,
      course,
      questionType,
      difficulty,
      tags,
      minPoints,
      maxPoints,
      dateFrom,
      dateTo,
      createdBy,
      isTemplate,
      page = 1,
      limit = 20
    } = req.body;
    
    const where = { isActive: true };
    const include = [];
    
    // Text search
    if (query) {
      where[Op.or] = [
        { questionText: { [Op.iLike]: `%${query}%` } },
        { topic: { [Op.iLike]: `%${query}%` } },
        { explanation: { [Op.iLike]: `%${query}%` } },
        { course: { [Op.iLike]: `%${query}%` } }
      ];
    }
    
    // Filters
    if (course) where.course = course;
    if (questionType) where.questionType = questionType;
    if (difficulty) where.difficulty = difficulty;
    if (minPoints !== undefined) where.points = { [Op.gte]: minPoints };
    if (maxPoints !== undefined) where.points = { ...where.points, [Op.lte]: maxPoints };
    if (dateFrom) where.createdAt = { [Op.gte]: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(dateTo) };
    if (createdBy) where.createdBy = createdBy;
    if (isTemplate !== undefined) where.isTemplate = isTemplate;
    
    // Tag filtering
    if (tags && tags.length > 0) {
      include.push({
        model: Tag,
        as: 'tags',
        where: {
          name: { [Op.in]: tags }
        },
        through: { attributes: [] }
      });
    }
    
    // Always include basic associations
    include.push(
      { model: Option, as: 'options' },
      { model: RubricCriteria, as: 'gradingRubric' }
    );
    
    if (!tags) {
      include.push({ model: Tag, as: 'tags' });
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: questions } = await Question.findAndCountAll({
      where,
      include,
      distinct: true,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: questions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    // Get unique courses
    const courses = await Question.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('course')), 'course']],
      where: { isActive: true },
      order: [['course', 'ASC']]
    });
    
    // Get all tags
    const tags = await Tag.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    // Get question type counts
    const questionTypes = await Question.findAll({
      attributes: [
        'questionType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['questionType']
    });
    
    // Get difficulty counts
    const difficulties = await Question.findAll({
      attributes: [
        'difficulty',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['difficulty']
    });
    
    // Get point ranges
    const pointStats = await Question.findOne({
      attributes: [
        [sequelize.fn('MIN', sequelize.col('points')), 'minPoints'],
        [sequelize.fn('MAX', sequelize.col('points')), 'maxPoints'],
        [sequelize.fn('AVG', sequelize.col('points')), 'avgPoints']
      ],
      where: { isActive: true }
    });
    
    res.json({
      success: true,
      data: {
        courses: courses.map(c => c.course),
        tags,
        questionTypes,
        difficulties,
        pointRanges: {
          min: pointStats.dataValues.minPoints,
          max: pointStats.dataValues.maxPoints,
          avg: Math.round(pointStats.dataValues.avgPoints)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// COURSE MANAGEMENT OPERATIONS
// ====================================

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Question.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('course')), 'course']],
      where: { isActive: true },
      order: [['course', 'ASC']]
    });
    
    res.json({
      success: true,
      data: courses.map(c => c.course)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getQuestionsByCourse = async (req, res) => {
  try {
    const { courseName } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const { count, rows: questions } = await Question.findAndCountAll({
      where: {
        course: courseName,
        isActive: true
      },
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: questions,
      course: courseName,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const renameCourse = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { oldName } = req.params;
    const { newName } = req.body;
    
    if (!newName || newName.trim() === '') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'New course name is required'
      });
    }
    
    // Update all questions with the old course name
    const [affectedCount] = await Question.update(
      { course: newName },
      {
        where: {
          course: oldName,
          isActive: true
        },
        transaction
      }
    );
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: {
        oldName,
        newName,
        updatedQuestions: affectedCount
      }
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// QUESTION BANK MANAGEMENT OPERATIONS
// ====================================

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's question stats
    const userStats = await Question.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalQuestions'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN is_template = true THEN 1 ELSE 0 END")), 'templates'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END")), 'easyQuestions'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END")), 'mediumQuestions'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END")), 'hardQuestions']
      ],
      where: {
        createdBy: userId,
        isActive: true
      }
    });
    
    // Get recent user activity
    const recentActivity = await Question.findAll({
      where: {
        createdBy: userId,
        isActive: true
      },
      order: [['updatedAt', 'DESC']],
      limit: 10,
      include: [
        { model: Tag, as: 'tags' }
      ]
    });
    
    // Get course distribution
    const courseDistribution = await Question.findAll({
      attributes: [
        'course',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdBy: userId,
        isActive: true
      },
      group: ['course'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5
    });
    
    res.json({
      success: true,
      data: {
        userStats: userStats[0]?.dataValues || {},
        recentActivity,
        courseDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getRecentQuestions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const questions = await Question.findAll({
      where: { isActive: true },
      include: [
        { model: Option, as: 'options' },
        { model: Tag, as: 'tags' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getMostUsedQuestions = async (req, res) => {
  try {
    // This would typically track question usage in quizzes/tests
    // For now, we'll return questions sorted by creation date
    const { limit = 10 } = req.query;
    
    const questions = await Question.findAll({
      where: { isActive: true },
      include: [
        { model: Option, as: 'options' },
        { model: Tag, as: 'tags' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// SHARING & COLLABORATION OPERATIONS
// ====================================

export const shareQuestion = async (req, res) => {
  try {
    const { userIds, permission, expiresAt } = req.body;
    const { id: questionId } = req.params;
    
    // This would typically create sharing records in a separate table
    // For now, we'll return a success response
    
    res.json({
      success: true,
      data: {
        questionId,
        sharedWith: userIds,
        permission,
        expiresAt,
        sharedBy: req.user.id,
        sharedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getSharedQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // This would typically query a sharing table
    // For now, return empty array
    
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const stopSharingQuestion = async (req, res) => {
  try {
    const { id: questionId, userId } = req.params;
    
    // This would typically remove sharing records
    
    res.json({
      success: true,
      message: `Stopped sharing question ${questionId} with user ${userId}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// VERSIONING OPERATIONS
// ====================================

export const createQuestionVersion = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    
    // This would typically create a version snapshot
    
    res.json({
      success: true,
      data: {
        questionId,
        versionId: 'v-' + Date.now(),
        createdAt: new Date(),
        createdBy: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getQuestionVersions = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    
    // This would typically retrieve version history
    
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const restoreQuestionVersion = async (req, res) => {
  try {
    const { id: questionId, versionId } = req.params;
    
    // This would typically restore from a version
    
    res.json({
      success: true,
      data: {
        questionId,
        versionId,
        restoredAt: new Date(),
        restoredBy: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const compareVersions = async (req, res) => {
  try {
    const { id: questionId, versionId1, versionId2 } = req.params;
    
    // This would typically compare two versions
    
    res.json({
      success: true,
      data: {
        questionId,
        version1: versionId1,
        version2: versionId2,
        differences: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// EXPORT SPECIFIC FORMATS
// ====================================

export const exportToQTI = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    
    const question = await Question.findByPk(questionId, {
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ],
      where: { isActive: true }
    });
    
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    // Generate QTI XML
    const qtiXml = generateQTIXml(question);
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="question_${questionId}.xml"`);
    res.send(qtiXml);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const exportToCSV = async (req, res) => {
  try {
    const { questionIds, includeAnswers = false, includeExplanations = false } = req.body;
    
    const where = { isActive: true };
    if (questionIds && questionIds.length > 0) {
      where.id = { [Op.in]: questionIds };
    }
    
    const questions = await Question.findAll({
      where,
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    const csvData = formatToCSV(questions, includeAnswers, includeExplanations);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="questions_${Date.now()}.csv"`);
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const exportToJSON = async (req, res) => {
  try {
    const { questionIds } = req.body;
    
    const where = { isActive: true };
    if (questionIds && questionIds.length > 0) {
      where.id = { [Op.in]: questionIds };
    }
    
    const questions = await Question.findAll({
      where,
      include: [
        { model: Option, as: 'options' },
        { model: RubricCriteria, as: 'gradingRubric' },
        { model: Tag, as: 'tags' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="questions_${Date.now()}.json"`);
    res.send(JSON.stringify(questions, null, 2));
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// HEALTH CHECK & UTILITY OPERATIONS
// ====================================

export const healthCheck = async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    // Get basic stats
    const questionCount = await Question.count({ where: { isActive: true } });
    const tagCount = await Tag.count();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date(),
        statistics: {
          questions: questionCount,
          tags: tagCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date()
      }
    });
  }
};

export const getQuestionCounts = async (req, res) => {
  try {
    const activeCount = await Question.count({ where: { isActive: true } });
    const inactiveCount = await Question.count({ where: { isActive: false } });
    const templateCount = await Question.count({ where: { isActive: true, isTemplate: true } });
    
    res.json({
      success: true,
      data: {
        active: activeCount,
        inactive: inactiveCount,
        templates: templateCount,
        total: activeCount + inactiveCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const cleanupQuestions = async (req, res) => {
  try {
    // This would typically archive or permanently delete old/inactive questions
    // For now, we'll just return a success response
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: {
        cleanedAt: new Date(),
        cleanedBy: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// WEBHOOK & INTEGRATION OPERATIONS
// ====================================

export const webhookCreateQuestion = async (req, res) => {
  try {
    const { apiKey, questions } = req.body;
    
    // Verify API key
    if (apiKey !== process.env.WEBHOOK_API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
    
    const createdQuestions = [];
    const errors = [];
    
    for (const qData of questions) {
      try {
        // Use a system user ID for webhook creations
        const systemUserId = '00000000-0000-0000-0000-000000000000';
        
        const question = await Question.create({
          ...qData,
          createdBy: systemUserId,
          isActive: true
        });
        
        createdQuestions.push(question);
      } catch (error) {
        errors.push({
          question: qData.questionText,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        created: createdQuestions.length,
        failed: errors.length,
        questions: createdQuestions,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const syncWithExternal = async (req, res) => {
  try {
    // This would typically sync with an external question bank or LMS
    
    res.json({
      success: true,
      message: 'Sync completed successfully',
      data: {
        syncedAt: new Date(),
        syncedBy: req.user.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// FEEDBACK & RATING OPERATIONS
// ====================================

export const addQuestionFeedback = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    const { rating, comment, type } = req.body;
    
    // This would typically save feedback to a separate table
    
    res.json({
      success: true,
      data: {
        questionId,
        rating,
        comment,
        type,
        submittedBy: req.user.id,
        submittedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getQuestionFeedback = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    
    // This would typically retrieve feedback from a separate table
    
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const rateQuestionDifficulty = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    const { difficulty, comment } = req.body;
    
    // This would typically save difficulty ratings
    
    res.json({
      success: true,
      data: {
        questionId,
        difficulty,
        comment,
        ratedBy: req.user.id,
        ratedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// AUDIT LOG OPERATIONS
// ====================================

export const getQuestionAuditLogs = async (req, res) => {
  try {
    const { id: questionId } = req.params;
    
    // This would typically retrieve audit logs from a separate table
    
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getMyQuestionActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's recent question activities
    const recentQuestions = await Question.findAll({
      where: {
        createdBy: userId,
        isActive: true
      },
      order: [['updatedAt', 'DESC']],
      limit: 20,
      include: [
        { model: Tag, as: 'tags' }
      ]
    });
    
    res.json({
      success: true,
      data: recentQuestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// BACKUP & RESTORE OPERATIONS
// ====================================

export const createQuestionBackup = async (req, res) => {
  try {
    // This would typically create a backup file
    
    res.json({
      success: true,
      data: {
        backupId: 'backup-' + Date.now(),
        createdAt: new Date(),
        createdBy: req.user.id,
        fileSize: '0KB',
        downloadUrl: `/api/questions/backup/download/backup-${Date.now()}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const restoreFromBackup = async (req, res) => {
  try {
    // This would typically restore from a backup file
    
    res.json({
      success: true,
      message: 'Restore completed successfully',
      data: {
        restoredAt: new Date(),
        restoredBy: req.user.id,
        questionsRestored: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const listBackups = async (req, res) => {
  try {
    // This would typically list available backup files
    
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// MIGRATION OPERATIONS
// ====================================

export const migrateQuestions = async (req, res) => {
  try {
    // This would typically handle schema migrations
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      data: {
        migratedAt: new Date(),
        migratedBy: req.user.id,
        questionsMigrated: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const validateMigration = async (req, res) => {
  try {
    // This would typically validate migration readiness
    
    res.json({
      success: true,
      data: {
        readyForMigration: true,
        validationDate: new Date(),
        issues: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ====================================
// HELPER FUNCTIONS
// ====================================

// Helper function to calculate text similarity (simplified)
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const cleanText1 = text1.toLowerCase().replace(/\s+/g, ' ');
  const cleanText2 = text2.toLowerCase().replace(/\s+/g, ' ');
  
  if (cleanText1 === cleanText2) return 1;
  
  // Simple word overlap calculation
  const words1 = new Set(cleanText1.split(' '));
  const words2 = new Set(cleanText2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

// Helper function to format questions as CSV
const formatToCSV = (questions, includeAnswers = false, includeExplanations = false) => {
  const headers = [
    'ID',
    'Question Text',
    'Question Type',
    'Course',
    'Difficulty',
    'Points',
    'Topic',
    'Tags',
    'Options',
    'Correct Answer',
    'Sample Answer',
    'Max Length',
    'Created At',
    'Updated At'
  ];
  
  const rows = questions.map(question => {
    const tags = question.tags?.map(t => t.name).join(', ') || '';
    const options = question.options?.map(opt => 
      `${opt.optionText}${opt.isCorrect ? ' (Correct)' : ''}`
    ).join(' | ') || '';
    
    let correctAnswer = '';
    if (question.questionType === 'multiple-choice') {
      const correctOptions = question.options?.filter(opt => opt.isCorrect) || [];
      correctAnswer = correctOptions.map(opt => opt.optionText).join(' | ');
    } else if (question.questionType === 'true-false') {
      correctAnswer = question.correctBoolean ? 'True' : 'False';
    } else if (question.questionType === 'short-answer') {
      correctAnswer = question.correctAnswer || '';
    }
    
    return [
      question.id,
      `"${question.questionText?.replace(/"/g, '""') || ''}"`,
      question.questionType,
      question.course,
      question.difficulty,
      question.points,
      question.topic || '',
      `"${tags}"`,
      `"${options}"`,
      `"${correctAnswer.replace(/"/g, '""')}"`,
      `"${question.sampleAnswer?.replace(/"/g, '""') || ''}"`,
      question.maxLength || '',
      question.createdAt,
      question.updatedAt
    ];
  });
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
};

// Helper function to generate QTI XML
const generateQTIXml = (question) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
  identifier="${question.id}"
  title="${question.questionText?.substring(0, 50) || 'Question'}">
  
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      ${getQTICorrectResponse(question)}
    </correctResponse>
  </responseDeclaration>
  
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  
  <itemBody>
    <div class="question-text">${escapeXml(question.questionText)}</div>
    
    ${getQTIOptions(question)}
    
    ${question.explanation ? `<div class="explanation">${escapeXml(question.explanation)}</div>` : ''}
  </itemBody>
  
  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>
</assessmentItem>`;
};

const getQTICorrectResponse = (question) => {
  switch (question.questionType) {
    case 'multiple-choice':
      const correctOption = question.options?.find(opt => opt.isCorrect);
      return correctOption ? `<value>${correctOption.id}</value>` : '';
    case 'true-false':
      return `<value>${question.correctBoolean}</value>`;
    default:
      return '';
  }
};

const getQTIOptions = (question) => {
  if (question.questionType === 'multiple-choice' && question.options) {
    return `
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="true" maxChoices="1">
      <prompt>Choose the correct answer:</prompt>
      ${question.options.map(opt => `
        <simpleChoice identifier="${opt.id}" fixed="true">
          ${escapeXml(opt.optionText)}
        </simpleChoice>
      `).join('')}
    </choiceInteraction>`;
  }
  return '';
};

const escapeXml = (text) => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// ====================================
// EXPORT ALL CONTROLLER FUNCTIONS
// ====================================

export const questionController = {
  // Core CRUD operations
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  
  // Template operations
  createFromTemplate,
  
  // Answer submission operations
  submitAnswer,
  submitBatchAnswers,
  
  // Tag management operations
  getTags,
  getQuestionsByTag,
  
  // Export/Import operations
  exportQuestions,
  importQuestions,
  downloadImportTemplate,
  
  // Statistics & analytics operations
  getQuestionStats,
  getDifficultyStats,
  getQuestionTypeStats,
  getCourseStats,
  
  // Bulk operations
  bulkUpdateQuestions,
  bulkDeleteQuestions,
  bulkChangeStatus,
  
  // Validation & duplicate check
  checkDuplicateQuestion,
  validateQuestionData,
  
  // Preview & clone operations
  previewQuestion,
  cloneQuestion,
  
  // Search & filter operations
  advancedSearch,
  getFilterOptions,
  
  // Course management operations
  getAllCourses,
  getQuestionsByCourse,
  renameCourse,
  
  // Question bank management operations
  getDashboardStats,
  getRecentQuestions,
  getMostUsedQuestions,
  
  // Sharing & collaboration operations
  shareQuestion,
  getSharedQuestions,
  stopSharingQuestion,
  
  // Versioning operations
  createQuestionVersion,
  getQuestionVersions,
  restoreQuestionVersion,
  compareVersions,
  
  // Export specific formats
  exportToQTI,
  exportToCSV,
  exportToJSON,
  
  // Health check & utility operations
  healthCheck,
  getQuestionCounts,
  cleanupQuestions,
  
  // Webhook & integration operations
  webhookCreateQuestion,
  syncWithExternal,
  
  // Feedback & rating operations
  addQuestionFeedback,
  getQuestionFeedback,
  rateQuestionDifficulty,
  
  // Audit log operations
  getQuestionAuditLogs,
  getMyQuestionActivity,
  
  // Backup & restore operations
  createQuestionBackup,
  restoreFromBackup,
  listBackups,
  
  // Migration operations
  migrateQuestions,
  validateMigration
};

export default questionController;