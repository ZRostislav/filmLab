export const UserModel = {
  async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  async deleteById(id) {
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
  }
};
