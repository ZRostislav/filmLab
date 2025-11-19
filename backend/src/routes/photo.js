import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from 'fs';

import { PhotoModel } from '../models/Photo.js';
import { PhotoChangesModel } from '../models/PhotoChanges.js';
import { BonusModel } from '../models/Bonus.js';

const router = express.Router();

// === Создание папки для загрузок ===
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// === Настройка multer ===
const storage = multer.diskStorage({
  // куда сохраняем файлы
  destination: (req, file, cb) => cb(null, 'uploads/'),
  // имя файла: timestamp + оригинальное имя
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// === Middleware авторизации через JWT ===
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // декодируем токен
    next(); // всё ок
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

/* =========================
   📸 Маршруты для фото
   ========================= */

// --- Загрузка фото авторизованным пользователем ---
router.post('/upload', auth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const id = await PhotoModel.create(req.user.id, req.file.filename);
    await PhotoChangesModel.logChange(id, req.user.id, 'created');
    res.json({ message: 'Photo uploaded', id, filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сохранения фото' });
  }
});

// --- Загрузка фото гостем ---
router.post('/guest-upload', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let bonus = await BonusModel.getByIp(ip);

  // Проверяем, есть ли бонус на сегодня
  if (!bonus || new Date(bonus.created_at).toDateString() !== new Date().toDateString()) {
    await BonusModel.addBonus(null, ip, 'guest', 5);
    bonus = await BonusModel.getByIp(ip);
  }

  // Если бонусов нет — отклоняем
  if (bonus.value <= 0) {
    return res.status(403).json({ message: 'Баллы закончились. Попробуйте завтра.' });
  }

  // Списываем один бонус
  await BonusModel.updateBonus(bonus.id, bonus.value - 1);

  // Отдаём файл и удаляем с диска
  res.download(req.file.path, req.file.originalname, err => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка скачивания файла' });
    }
    fs.unlinkSync(req.file.path);
  });
});

// --- Все фото всех пользователей ---
router.get('/all', auth, async (req, res) => {
  try {
    const photos = await PhotoModel.getAllWithUsers();
    res.json(photos);
  } catch (err) {
    console.error('Ошибка получения всех фото:', err);
    res.status(500).json({ message: 'Ошибка получения всех фото' });
  }
});

// --- Фото конкретного пользователя ---
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = +req.params.userId;
    const photos = await PhotoModel.getAllByUser(userId);
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения фото пользователя' });
  }
});

// --- История изменений фото ---
router.get('/:id/history', auth, async (req, res) => {
  try {
    const id = +req.params.id;
    const history = await PhotoChangesModel.getHistory(id);
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения истории' });
  }
});

// --- Фото текущего пользователя ---
router.get('/', auth, async (req, res) => {
  try {
    const photos = await PhotoModel.getAllByUser(req.user.id);
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка получения фото' });
  }
});

// --- Фото по ID ---
router.get('/:id', auth, async (req, res) => {
  try {
    const id = +req.params.id;
    const photo = await PhotoModel.getById(id);
    if (!photo) return res.status(404).json({ message: 'Фото не найдено' });
    res.json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- Замена фото ---
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const id = +req.params.id;
    const oldPhoto = await PhotoModel.getById(id);
    if (!oldPhoto) return res.status(404).json({ message: 'Фото не найдено' });

    if (req.file) {
      const oldPath = `uploads/${oldPhoto.filename}`;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

      await PhotoModel.updateFilename(id, req.file.filename);
      await PhotoChangesModel.logChange(id, req.user.id, 'updated');

      res.json({ message: 'Фото обновлено', id, filename: req.file.filename });
    } else {
      res.status(400).json({ message: 'Файл не загружен' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка обновления фото' });
  }
});

// --- Удаление фото ---
router.delete('/:id', auth, async (req, res) => {
  try {
    await PhotoModel.delete(req.params.id);
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка удаления фото' });
  }
});

export default router;
