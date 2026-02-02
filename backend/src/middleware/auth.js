import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // 把登入者資訊掛到 req 上，後面路由用得到
    req.user = payload;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
