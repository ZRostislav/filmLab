import { db } from '../utils/db.js';

export const PhotoChangesModel = {
  async logChange(photo_id, user_id, action) {
    return db.execute(
      'INSERT INTO photo_changes (photo_id, user_id, action, created_at) VALUES (?, ?, ?, NOW())',
      [photo_id, user_id, action]
    );
  },

async getHistory(photo_id) {
  const [rows] = await db.execute(
    `SELECT 
        pc.id AS change_id,
        pc.photo_id,
        p.filename AS photo_filename,
        pc.user_id,
        u.email AS user_email,
        CASE pc.action
            WHEN 'created' THEN 'Создано'
            WHEN 'updated' THEN 'Обновлено'
            WHEN 'deleted' THEN 'Удалено'
            ELSE pc.action
        END AS action,
        pc.created_at AS change_time
     FROM photo_changes pc
     JOIN photos p ON pc.photo_id = p.id
     JOIN users u ON pc.user_id = u.id
     WHERE pc.photo_id = ?
     ORDER BY pc.created_at DESC`,
    [photo_id]
  );
  return rows;
}



};
