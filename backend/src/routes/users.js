import express from 'express';
import { pool } from '../db/pool.js';
import { authRequired } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// 只有登入者才能取得自己的資料
router.get('/me', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authRequired, authorize(['admin']), async (req, res) => {
  try {
    // querystring 會是字串，先轉數字
    let limit = Number(req.query.limit ?? 20);
    let offset = Number(req.query.offset ?? 0);

    // 防呆：NaN / 負數
    if (!Number.isFinite(limit) || limit <= 0) limit = 20;
    if (!Number.isFinite(offset) || offset < 0) offset = 0;

    // 上限避免一次撈爆
    if (limit > 50) limit = 50;

    const totalResult = await pool.query('SELECT COUNT(*)::int AS total FROM users');
    const total = totalResult.rows[0].total;

    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users ORDER BY id DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      paging: {
        total,
        limit,
        offset,
        hasNext: offset + limit < total,
      },
      users: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, password } = req.body;

    if (!email && !password) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    let query = 'UPDATE users SET ';
    const values = [];
    let index = 1;

    if (email) {
      query += `email = $${index}, `;
      values.push(email);
      index++;
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      query += `password = $${index}, `;
      values.push(hashed);
      index++;
    }

    query = query.slice(0, -2); // 移除最後逗號
    query += ` WHERE id = $${index} RETURNING id, email, role, created_at`;
    values.push(userId);

    const result = await pool.query(query, values);

    res.json({ message: 'Updated', user: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/role', authRequired, authorize(['admin']), async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { role } = req.body;

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Role must be admin or user' });
    }

    // 防呆：避免 admin 把自己降權鎖死（建議保留）
    if (targetId === req.user.id && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot downgrade yourself' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role, created_at',
      [role, targetId]
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Role updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authRequired, authorize(['admin']), async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    // 防呆：不能刪自己
    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, email, role',
      [targetId]
    );

    const deleted = result.rows[0];
    if (!deleted) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted', user: deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});



export default router;
