import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/env.js';

const authorise = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findByPk(decoded.id);

    const user = req.user; // Assuming req.user is set after authentication
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // Add any additional authorization logic here if needed

    next();
  } catch (error) {
    next(error);
  }
};

export default authorise ;