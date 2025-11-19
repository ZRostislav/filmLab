import { db } from '../utils/db.js';

const checkAdmin = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.json({ isAdmin: false });
    }

    const userId = req.user.id;

    const [rows] = await db.execute(
      'SELECT role FROM admins WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ isAdmin: false });
    }

    return res.json({ isAdmin: true, role: rows[0].role });
  } catch (err) {
    console.error('Ошибка проверки администратора:', err);
    return res.status(500).json({ isAdmin: false, error: 'Server error' });
  }
};

export default checkAdmin;
