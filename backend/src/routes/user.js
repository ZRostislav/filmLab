import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../utils/db.js';
const router = express.Router();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// Удаление аккаунта
router.delete('/delete', auth, async (req, res) => {
  await db.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
  await db.execute('DELETE FROM photos WHERE user_id = ?', [req.user.id]);
  res.json({ message: 'Account deleted' });
});

router.get('/all', auth, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, email, created_at FROM users');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения списка пользователей' });
  }
});

export default router;

