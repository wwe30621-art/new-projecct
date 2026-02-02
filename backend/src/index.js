import 'dotenv/config';
import express from 'express';
import { pool } from './db/pool.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import cors from "cors";


const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', usersRoutes);
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS time');
    res.json({
      ok: true,
      dbTime: result.rows[0].time,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});
app.get('/docs.json', (req, res) => res.json(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

console.log('mounted /auth routes');