import express from 'express';
import {getAllUsersExceptMe, loginController,logoutController,registerController } from '../interfaces/http/controllers/auth-controller';

const router = express.Router();

router.post('/login', loginController);
router.post('/register', registerController);
router.post('/logout', logoutController);
router.get('/users', getAllUsersExceptMe);


export default router;