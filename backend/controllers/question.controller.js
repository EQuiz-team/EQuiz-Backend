// controllers/question.controller.js
import { Question, Option, RubricCriteria, Tag, QuestionTag } from '../models/associations.js';
import { Op } from 'sequelize';
import sequelize from '../database/postgress.js';

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

// Get all tags for autocomplete
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

// Get questions by tag
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