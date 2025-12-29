import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import { sequelize } from '../database/postgress.js';

// Add to auth.controller.js or create a new file
export const migratePasswords = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting password migration...');
    
    const users = await User.findAll({ transaction });
    console.log(`Found ${users.length} users to check`);
    
    let updatedCount = 0;
    let alreadyHashed = 0;
    
    for (const user of users) {
      const password = user.password;
      
      // Check if password is already hashed
      const isHashed = password && (
        password.startsWith('$2a$') || 
        password.startsWith('$2b$') || 
        password.startsWith('$2y$')
      );
      
      if (!isHashed && password) {
        console.log(`Hashing password for: ${user.email} (${password.length} chars)`);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save({ transaction });
        updatedCount++;
      } else if (isHashed) {
        alreadyHashed++;
      }
    }
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Password migration complete',
      data: {
        totalUsers: users.length,
        updated: updatedCount,
        alreadyHashed: alreadyHashed,
        plainTextPasswords: updatedCount
      }
    });
    
  } catch (error) {
    await transaction.rollback();
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};