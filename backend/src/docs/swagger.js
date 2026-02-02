import path from "path";
import { fileURLToPath } from "url";
import swaggerJSDoc from "swagger-jsdoc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth & Users API",
      version: "1.0.0",
      description: "Node.js + Express + PostgreSQL + JWT + RBAC + Pagination",
    },
    servers: [{ url: "http://localhost:3001" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
  },

  // ✅ 關鍵：用絕對路徑掃你的 routes
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../routes/**/*.js"),
  ],
});
