import express from 'express';
import { saveMessageController } from '../interfaces/http/controllers/message-controller';

const router = express.Router();

router.post('/save', saveMessageController);


export default router;