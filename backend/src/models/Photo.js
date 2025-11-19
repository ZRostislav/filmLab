import { db } from '../utils/db.js'; // ../ — чтобы подняться на уровень выше

export const PhotoModel = {
  async create(userId, filename) {
    const [result] = await db.execute(
      'INSERT INTO photos (user_id, filename) VALUES (?, ?)',
      [userId, filename]
    );
    return result.insertId; // вернём id только что вставленной фотки
  },

  async getAllByUser(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM photos WHERE user_id = ?',
      [userId]
    );
    return rows;
  },

  async delete(id) {
    await db.execute('DELETE FROM photos WHERE id = ?', [id]);
  },

  async getById(id) {
    const [rows] = await db.execute('SELECT * FROM photos WHERE id = ?', [id]);
    return rows[0]; // вернем одно фото
  },

  async updateFilename(id, filename) {
    await db.execute(
      'UPDATE photos SET filename = ? WHERE id = ?',
      [filename, id]
    );
  },

  async getAllWithUsers() {
    const [rows] = await db.execute(`
      SELECT p.id, p.filename, p.created_at, u.email AS user_email
      FROM photos p
      LEFT JOIN users u ON p.user_id = u.id
    `);
    return rows;
  }

};
