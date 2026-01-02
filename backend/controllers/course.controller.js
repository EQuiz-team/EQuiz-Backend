import Course from '../models/course.model.js';

export const getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const foundCourse = await Course.findOne({ where: { code } });

    if (!foundCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }
    res.status(200).json({
      success: true,
      data: foundCourse,
    });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const newCourse = await Course.create({ title, description });
    res.status(201).json({
      success: true,
      data: newCourse,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { title, description } = req.body;
    const foundCourse = await Course.findByPk(code);
    if (!foundCourse) {
        return res.status(404).json({
            success: false,
            message: 'Course not found',
        });
    }
    foundCourse.title = title || foundCourse.title;
    foundCourse.description = description || foundCourse.description;
    await foundCourse.save();
    res.status(200).json({
      success: true,
      data: foundCourse,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
    try {
        const { code } = req.params;
        const foundCourse = await Course.findOne({ where: { code } });
        if (!foundCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }
        await foundCourse.destroy();
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const countCourses = async (req, res, next) => {
    try {
        const courseCount = await Course.count();
        res.status(200).json({
            success: true,
            data: { count: courseCount },
        });
    }
    catch (error) {
        next(error);
    }
};
