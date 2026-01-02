import Question from '../models/question.model.js';

export const createQuestion = async (req, res, next) => {
    try {
        const newQuestion = await Question.create({ 
            ...req.body,
             userId: req.user.id
            });
            
        res.status(201).json({
            success: true,
            data: newQuestion,
        });

    } catch (error) {
        next(error);
    }

};