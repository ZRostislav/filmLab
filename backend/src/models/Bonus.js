// models/Bonus.js
import { db } from "../utils/db.js";

export const BonusModel = {
  // --- Получить или создать бонус ---
  getOrCreate: async function({ userId = null, ip = null }) {
    // 0. Удаляем все записи за прошлые дни
    await db.execute(
      `DELETE FROM bonuses WHERE bonus_date < CURDATE()`
    );

    if (userId) {
      // 1. Проверяем есть ли бонус у пользователя на сегодня
      const [userRows] = await db.execute(
        `SELECT * FROM bonuses WHERE user_id = ? AND bonus_date = CURDATE()`,
        [userId]
      );
      if (userRows.length > 0) return userRows[0];

      // 2. Проверяем, есть ли гостевой бонус по IP
      if (ip) {
        const [guestRows] = await db.execute(
          `SELECT * FROM bonuses WHERE ip = ? AND bonus_date = CURDATE() AND type = 'guest'`,
          [ip]
        );
        if (guestRows.length > 0) {
          const guest = guestRows[0];
          // апгрейдим гостевой бонус в пользовательский
          await db.execute(
            `UPDATE bonuses SET user_id = ?, ip = NULL, type = 'user', value = 36 WHERE id = ?`,
            [userId, guest.id]
          );
          return { ...guest, user_id: userId, ip: null, type: "user", value: 36 };
        }
      }

      // 3. Если нет записей → создаём новую для юзера
      const [result] = await db.execute(
        `INSERT INTO bonuses (user_id, ip, type, value, created_at, bonus_date)
         VALUES (?, NULL, 'user', 36, NOW(), CURDATE())`,
        [userId]
      );
      return {
        id: result.insertId,
        user_id: userId,
        ip: null,
        type: "user",
        value: 36,
        created_at: new Date(),
        bonus_date: new Date().toISOString().slice(0, 10)
      };
    }

    // --- Если гость (нет userId) ---
    if (ip) {
      const [guestRows] = await db.execute(
        `SELECT * FROM bonuses WHERE ip = ? AND bonus_date = CURDATE()`,
        [ip]
      );
      if (guestRows.length > 0) return guestRows[0];

      // создаём новую запись для гостя
      const [result] = await db.execute(
        `INSERT INTO bonuses (user_id, ip, type, value, created_at, bonus_date)
         VALUES (NULL, ?, 'guest', 5, NOW(), CURDATE())`,
        [ip]
      );
      return {
        id: result.insertId,
        user_id: null,
        ip,
        type: "guest",
        value: 5,
        created_at: new Date(),
        bonus_date: new Date().toISOString().slice(0, 10)
      };
    }

    return null;
  },

  // --- Списать бонусы ---
  spendBonus: async function({ userId = null, ip = null, amount = 1 }) {
    const [rows] = await db.execute(
      `SELECT * FROM bonuses WHERE ${userId ? "user_id = ?" : "ip = ?"} AND bonus_date = CURDATE()`,
      [userId || ip]
    );
    if (rows.length === 0) return null;

    const bonus = rows[0];
    if (bonus.value < amount) return { ...bonus, blocked: true };

    await db.execute(`UPDATE bonuses SET value = value - ? WHERE id = ?`, [amount, bonus.id]);
    return { ...bonus, value: bonus.value - amount, blocked: false };
  },

  // --- Сброс бонусов для гостей ---
  resetBonus: async function({ ip, userId = null }) {
    const [rows] = await db.execute(
      `SELECT * FROM bonuses WHERE ip = ? AND type = 'guest'`,
      [ip]
    );

    if (rows.length > 0) {
      // Уже тратили — бонус = 0
      await db.execute(`UPDATE bonuses SET value = 0 WHERE ip = ?`, [ip]);
      return 0;
    } else {
      // Не тратили — бонус = 5
      await db.execute(`UPDATE bonuses SET value = 5 WHERE ip = ?`, [ip]);
      return 5;
    }
  }
};
