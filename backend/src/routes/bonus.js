import express from "express";
import { BonusModel } from "../models/Bonus.js";
import authOptional from "../middleware/authOptional.js";
import { db } from "../utils/db.js";


const router = express.Router();

// Получить или создать бонус
router.get("/balance", authOptional, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ip = req.ip;
    const bonus = await BonusModel.getOrCreate({ userId, ip });
    res.json(bonus);
  } catch (error) {
    console.error("Ошибка в /bonus/balance:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Списать бонусы
router.post("/spend", authOptional, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ip = req.ip;
    const { amount = 1 } = req.body;

    const bonus = await BonusModel.spendBonus({ userId, ip, amount });

    if (!bonus) return res.status(400).json({ error: "No bonus record for today" });
    if (bonus.blocked) return res.status(403).json({ error: "No more bonuses today", bonus });

    res.json(bonus);
  } catch (error) {
    console.error("Ошибка в /bonus/spend:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset", authOptional, async (req, res) => {
  try {
    const ip = req.ip;
    const userId = req.user?.id || null;

    // Берём текущий бонус гостя
    const [rows] = await db.execute(
      `SELECT * FROM bonuses WHERE ip = ? AND type = 'guest' ORDER BY created_at DESC LIMIT 1`,
      [ip]
    );

    if (rows.length === 0) {
      // Бонуса нет → создаём новый 5
      const [result] = await db.execute(
        `INSERT INTO bonuses (ip, type, value, created_at, bonus_date)
         VALUES (?, 'guest', 5, NOW(), CURDATE())`,
        [ip]
      );
      return res.json({ success: true, value: 5 });
    }

    const bonus = rows[0];

    if (bonus.value === 5) {
      // Гость не тратил — оставляем 5
      return res.json({ success: true, value: 5 });
    } else {
      // Гость уже тратил — оставляем текущее значение
      return res.json({ success: true, value: bonus.value });
    }

  } catch (error) {
    console.error("Ошибка в /bonus/reset:", error);
    res.status(500).json({ error: "Server error" });
  }
});



export default router;
