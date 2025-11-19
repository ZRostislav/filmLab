import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../utils/db.js';
import authOptional from '../middleware/authOptional.js';
import checkAdmin from '../middleware/checkAdmin.js';

const router = express.Router();

// ✅ Регистрация
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await db.execute(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, hashed]
  );
  res.json({ message: 'User registered' });
});

// ✅ Логин
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];
  if (!user)
    return res.status(400).json({ message: 'User not found !' });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(400).json({ message: 'Wrong password' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});

// ✅ Проверка админа
router.get('/is-admin', authOptional, checkAdmin);

export default router;
