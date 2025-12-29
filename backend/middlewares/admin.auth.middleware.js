// middleware/admin.auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

const authorizeAdmin = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        message: 'Unauthorized: No token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Unauthorized: User not found' 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Unauthorized: User account is inactive' 
      });
    }

    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Forbidden: Admin access required',
        requiredRole: 'admin',
        currentRole: user.role
      });
    }

    // Attach user to request object
    req.user = user;
    
    // User is authenticated and authorized as admin
    next();
  } catch (error) {
    // Handle JWT errors specifically
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Unauthorized: Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Unauthorized: Token has expired' 
      });
    }
    
    // Pass other errors to error handler
    next(error);
  }
};

export default authorizeAdmin;