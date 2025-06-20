import express from 'express';
import { getChatHistory } from '../interfaces/http/controllers/message-controller';

const router = express.Router();

router.get('/history/:userA/:userB', getChatHistory);


export default router;