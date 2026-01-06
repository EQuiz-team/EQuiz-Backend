import { Router } from "express";
import authorise from '../middlewares/auth.middleware.js';
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import authorizeAdmin from '../middlewares/admin.auth.middleware.js';
import authorizeTeacher from '../middlewares/teacher.auth.middleware.js';

const userRouter = Router();

// Define your user routes here
userRouter.get('/', authorizeAdmin, getAllUsers);

userRouter.get('/:id', authorise, getUserById);

userRouter.post('/signup', createUser);

userRouter.put('/:id', authorise, updateUser);

userRouter.delete('/:id', authorizeAdmin, deleteUser);

export default userRouter;