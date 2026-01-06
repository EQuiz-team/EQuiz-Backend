import { sequelize } from '../database/postgress.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid'; // Add this import at top

export const signUp = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    // Log the request body for debugging
    console.log('Request body:', req.body);
    
    // Destructure with default values to prevent undefined errors
    const { 
      name = '', 
      email = '', 
      password = '', 
      confirmPassword = '',
      role = 'user' 
    } = req.body;
    
    // Trim and normalize values
    const trimmedName = name.toString().trim();
    const trimmedEmail = email.toString().trim().toLowerCase();
    const trimmedPassword = password.toString();
    const trimmedConfirmPassword = confirmPassword.toString();
    
    // Check for empty strings after trimming
    if (!trimmedName) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Name is required',
        field: 'name'
      });
    }

    if (!trimmedEmail) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Email is required',
        field: 'email'
      });
    }

    if (!trimmedPassword) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Password is required',
        field: 'password'
      });
    }

    if (!trimmedConfirmPassword) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Confirm password is required',
        field: 'confirmPassword'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address',
        field: 'email'
      });
    }

    // Check password match
    if (trimmedPassword !== trimmedConfirmPassword) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match',
        fields: ['password', 'confirmPassword']
      });
    }

    // Check password strength
    if (trimmedPassword.length < 8) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 8 characters long',
        field: 'password',
        minLength: 8
      });
    }

    // Validate role
    const validRoles = ['user', 'student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Role must be either "user" or "admin"',
        field: 'role',
        validRoles
      });
    }

    // In signUp function:
    let studentId = null;
    let teacherId = null;
    let adminId = null;

    if (role === 'student') {
      // Generate UUID instead of string
      studentId = uuidv4();
      // Or keep count but prefix with UUID
      //const studentCount = await User.count({ where: { role: 'student' } });
      //studentId = `${uuidv4().substring(0, 8)}-STU${String(studentCount + 1).padStart(3, '0')}`;

    } else if (role === 'teacher') {
      teacherId = uuidv4();
    } else if (role === 'admin') {
      adminId = uuidv4();
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { email: trimmedEmail },
      transaction 
    });
    
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ 
        success: false,
        message: 'Email is already registered',
        field: 'email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

    // Create user
    const newUser = await User.create({
      name: trimmedName, 
      email: trimmedEmail, 
      password: hashedPassword, 
      role,
      studentId,    // Add this
      teacherId,    // Add this
      adminId,      // Add this
      isActive: true
    }, { transaction });

    // Create JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email,
        name: newUser.name,
        role: newUser.role 
      }, 
      JWT_SECRET || process.env.JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN || '24h' }
    );

    await transaction.commit();
    
    // Remove password from response
    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    // Rollback transaction on error
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error('Signup Error:', error);

    // Handle specific errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        field: 'email'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const signIn = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('SignIn Request body:', req.body);
    
    // Destructure with default values
    const { email = '', password = '' } = req.body;
    
    // Trim and normalize values
    const trimmedEmail = email.toString().trim().toLowerCase();
    const trimmedPassword = password.toString();
    
    // Validate required fields
    if (!trimmedEmail) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Email is required',
        field: 'email'
      });
    }

    if (!trimmedPassword) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Password is required',
        field: 'password'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false,
        message: 'Please provide a valid email address',
        field: 'email'
      });
    }

    // Find user by email with transaction
    const user = await User.findOne({ 
      where: { email: trimmedEmail },
      transaction 
    });

    console.log('User found:', user ? 'YES' : 'NO');
    console.log('User details:', user ? {
      id: user.id,
      email: user.email,
      passwordExists: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    } : 'No user found');
    
    console.log('6. User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('7. User details:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        passwordExists: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        passwordFirst10: user.password ? user.password.substring(0, 10) + '...' : 'null'
      });
    }

    if (!user) {
      console.log('8. User not found - returning 401');
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    
    if (!isMatch) {
      await transaction.rollback();
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password bcrypt bastard'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name,
        role: user.role
      }, 
      JWT_SECRET || process.env.JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN || '24h' }
    );

    // Update last login time (if you have such a field)
    // Note: Your User model doesn't have lastLoginAt, so you might want to add it
    // If you don't have it, you can skip this part

    await transaction.commit();

    // Remove password from response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        tokenType: 'Bearer',
        expiresIn: JWT_EXPIRES_IN || '24h'
      }
    });

  } catch (error) {
    // Rollback transaction on error
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error('SignIn Error:', error);

    // Handle specific errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error during login',
        errors: messages
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const signOut = async (req, res, next) => {
  // Implementation for user logout
  try {
    // Clear token from client-side storage
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('SignOut Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};