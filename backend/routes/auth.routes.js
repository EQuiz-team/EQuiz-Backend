import { Router } from 'express';
import { signIn, signUp, signOut } from '../controllers/auth.controller.js';
import { migratePasswords } from '../controllers/migratePassword.js';

const authRouter = Router();
// Define your authentication routes here
// Path : api/v1/auth/
authRouter.post('/login', signIn);

authRouter.post('/signup', signUp);

authRouter.post('/logout', signOut);

authRouter.post('/migrate-passwords', migratePasswords);

export default authRouter;