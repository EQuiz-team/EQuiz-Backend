import User from '../models/user.model.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();
    res.status(200).json({
        success: true,
        data: users
    });

  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error });
    next(error);

  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] } // Exclude password for security
    });   
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
        success: true,
        data: user
    });
    } catch (error) {
    res.status(500).json({ message: 'Error retrieving user', error });
    next(error);

  }
};

export const createUser = async (req, res, next) => {
  try {
    console.log('Creating user with:', req.body);
    
    // Validate role-specific IDs before creating
    const { role, studentId, teacherId, adminId } = req.body;
    
    // Prepare user data
    const userData = {
      ...req.body,
      studentId: role === 'student' ? studentId : null,
      teacherId: role === 'teacher' ? teacherId : null,
      adminId: role === 'admin' ? adminId : null
    };
    
    // Create user using Sequelize's create() method
    const savedUser = await User.create(userData);
    
    // Remove password from response
    const userResponse = savedUser.toJSON();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error in createUser:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
        field: 'email'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating user', 
      error: error.message
    });
  }
};

export const updateUser = async (req, res, next) => {
    try {
        const updatedUser = await User.findByPk(req.params.id);
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        await updatedUser.update(req.body);
        res.status(200).json({
            success: true,
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error });
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const deletedUser = await User.findByPk(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await deletedUser.destroy();
        res.status(200).json({
            success: true,
            data: deletedUser
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
        next(error);
    }
};