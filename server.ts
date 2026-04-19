import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
const { Pool } = pg;
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { rateLimit } from 'express-rate-limit';
import helmet from "helmet";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isPostgres = !!process.env.DATABASE_URL;
let pool: any = null;
let sqlite: any = null;

async function setupDatabase() {
  try {
    if (isPostgres) {
      const rawUrl = process.env.DATABASE_URL!;
      console.log(`DATABASE_URL detected (length: ${rawUrl.length})`);
      
      if (rawUrl.includes("[YOUR-PASSWORD]") || rawUrl.includes("YOUR_PASSWORD") || rawUrl.includes("<password>")) {
        console.error("❌ DATABASE_URL contains a placeholder!");
        isPostgres = false;
      } else {
        try {
          pool = new Pool({
            connectionString: rawUrl,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
            idleTimeoutMillis: 60000,      // 1 րոպե — Supabase free tier-ի disconnect-ից պաշտպանություն
            max: 3,                         // max connections (Supabase free limit-ի համար)
            keepAlive: true,               // TCP keepAlive — Supabase-ի idle disconnect-ից պաշտպանություն
            keepAliveInitialDelayMillis: 10000,
          });

          // Pool error handler — connection drop-ի դեպքում server-ը չ-crash-անա
          pool.on('error', (err: any) => {
            console.error('⚠️ Postgres pool error (will auto-reconnect):', err.message);
          });

          await pool.query("SELECT 1");
          console.log("✅ Connected to Postgres successfully");
        } catch (error: any) {
          console.error("❌ Postgres connection failed:", error.message);
          isPostgres = false;
          pool = null;
        }
      }
    }

    if (!isPostgres) {
      try {
        sqlite = new Database("database.sqlite");
        console.log("✅ Using SQLite database");
      } catch (sqliteError: any) {
        console.error("❌ SQLite initialization failed:", sqliteError.message);
        sqlite = null;
      }
    }
  } catch (globalDbError: any) {
    console.error("❌ Global database setup error:", globalDbError.message);
  }
}

// Auto-reconnect helper for Postgres
async function reconnectPostgres() {
  try {
    const rawUrl = process.env.DATABASE_URL!;
    if (!rawUrl) return;
    console.log("🔄 Attempting Postgres reconnect...");
    const newPool = new Pool({
      connectionString: rawUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 60000,
      max: 3,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });
    newPool.on('error', (err: any) => {
      console.error('⚠️ Postgres pool error:', err.message);
    });
    await newPool.query("SELECT 1");
    pool = newPool;
    console.log("✅ Postgres reconnected successfully");
  } catch (err: any) {
    console.error("❌ Postgres reconnect failed:", err.message);
  }
}

// Database helper
async function query(text: string, params: any[] = []) {
  if (isPostgres && pool) {
    try {
      const result = await pool.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount };
    } catch (error: any) {
      // Connection-ը կորած է — auto-reconnect փորձել
      const isConnErr = error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' ||
        error.code === '57P01' || error.message?.includes('terminated') ||
        error.message?.includes('Connection') || error.message?.includes('connect');
      if (isConnErr) {
        console.error("⚠️ Postgres connection lost, reconnecting...");
        await reconnectPostgres();
        if (pool) {
          // Մեկ անգամ retry
          const retryResult = await pool.query(text, params);
          return { rows: retryResult.rows, rowCount: retryResult.rowCount };
        }
      }
      console.error("Postgres query failed:", error);
      throw error;
    }
  } else if (sqlite) {
    // Convert $1, $2 to ? for SQLite
    const sqliteText = text.replace(/\$\d+/g, "?");
    if (text.trim().toUpperCase().startsWith("SELECT")) {
      const rows = sqlite.prepare(sqliteText).all(...params);
      return { rows, rowCount: rows.length };
    } else {
      const result = sqlite.prepare(sqliteText).run(...params);
      return { rows: [], rowCount: result.changes, lastInsertRowid: result.lastInsertRowid };
    }
  }
  throw new Error("Database not initialized");
}

// Initialize database
async function initDb() {
  const productsTable = isPostgres 
    ? `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        image TEXT,
        category TEXT NOT NULL,
        min_quantity INTEGER DEFAULT 1
      )`
    : `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        image TEXT,
        category TEXT NOT NULL,
        min_quantity INTEGER DEFAULT 1
      )`;

  const promoCodesTable = isPostgres
    ? `CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_percent INTEGER NOT NULL
      )`
    : `CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        discount_percent INTEGER NOT NULL
      )`;

  const ordersTable = isPostgres
    ? `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        total_price REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    : `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_address TEXT NOT NULL,
        total_price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`;

  const orderItemsTable = isPostgres
    ? `CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price_at_time REAL NOT NULL
      )`
    : `CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price_at_time REAL NOT NULL
      )`;

  const adminSettingsTable = `CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`;

  await query(productsTable);
  await query(promoCodesTable);
  await query(ordersTable);
  await query(orderItemsTable);
  await query(adminSettingsTable);

  // Migration: Add min_quantity to products if it doesn't exist
  try {
    if (isPostgres) {
      await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1");
    } else {
      // SQLite: check columns before altering
      const cols = sqlite.prepare("PRAGMA table_info(products)").all() as any[];
      if (!cols.some((c: any) => c.name === 'min_quantity')) {
        await query("ALTER TABLE products ADD COLUMN min_quantity INTEGER DEFAULT 1");
      }
    }
  } catch (e) {
    // Column probably already exists
  }

  // Migration: Add is_blocked to products if it doesn't exist
  try {
    if (isPostgres) {
      await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE");
    } else {
      const cols = sqlite.prepare("PRAGMA table_info(products)").all() as any[];
      if (!cols.some((c: any) => c.name === 'is_blocked')) {
        await query("ALTER TABLE products ADD COLUMN is_blocked INTEGER DEFAULT 0");
      }
    }
  } catch (e) {
    // Column probably already exists
  }

  // Set default admin password if not exists or hash it if it's plain text
  const adminPass = await query("SELECT value FROM admin_settings WHERE key = 'password'");
  if (adminPass.rowCount === 0) {
    const hashedDefault = await bcrypt.hash('admin123', 10);
    await query("INSERT INTO admin_settings (key, value) VALUES ('password', $1)", [hashedDefault]);
  } else {
    const currentVal = adminPass.rows[0].value;
    // Check if it looks like a bcrypt hash (bcrypt hashes usually start with $2a$, $2b$, or $2y$)
    if (!currentVal.startsWith('$2')) {
      console.log("🔒 Migrating plain-text admin password to hashed version...");
      const hashed = await bcrypt.hash(currentVal, 10);
      await query("UPDATE admin_settings SET value = $1 WHERE key = 'password'", [hashed]);
    }
  }
}

// Session store — token → expiry timestamp
const sessions = new Map<string, number>();

async function startServer() {
  try {
    await setupDatabase();
    await initDb();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Continue starting the server even if DB fails, so the UI can show the error status
  }
  
  const app = express();
  app.set('trust proxy', 1); // Trust the first proxy (Cloud Run/Nginx)
  app.use(helmet({
    contentSecurityPolicy: false, // Միացրած է, եթե կկարգավորվի, բայց այս պահին false՝ նկարների համար
    crossOriginEmbedderPolicy: false,
  }));
  // Upload endpoint-ի համար մեծ limit, մնացածի համար՝ փոքր (DoS պաշտպանություն)
  app.use('/api/upload-cart-image', express.json({ limit: '50mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  // Brute-force protection for admin login
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: { error: "Չափազանց շատ փորձեր, խնդրում ենք փորձել մի փոքր ուշ:" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });

  // Upload endpoint-ի rate limit — Cloudinary-ի ծախսից պաշտպանություն
  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // max 10 upload per IP per minute
    message: { error: "Չափազանց շատ upload, խնդրում ենք մի փոքր սպասել:" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });

  // Admin session middleware — x-admin-token header-ը ստուգում է
  const requireAdmin = (req: any, res: any, next: any) => {
    const token = req.headers['x-admin-token'] as string;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const expires = sessions.get(token);
    if (!expires || Date.now() > expires) {
      sessions.delete(token);
      return res.status(401).json({ error: "Session expired" });
    }
    // Renew session — ամեն հաջող request-ից հետո 8 ժամ երկարացնել
    sessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
    next();
  };

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      if (!isPostgres && !sqlite) {
        return res.status(503).json({ error: "Database not available. Please check server configuration." });
      }
      const result = await query("SELECT * FROM products ORDER BY id DESC");
      res.json(result.rows);
    } catch (error) {
      console.error("GET /api/products error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    try {
      const { name, price, code, description, image, category, min_quantity } = req.body;
      // Validation
      const VALID_CATEGORIES = ['sneakers', 'slippers'];
      if (!name || typeof name !== 'string' || !name.trim() || name.length > 200)
        return res.status(400).json({ error: "Անվանումը պարտադիր է (մինչ 200 նիշ)" });
      if (typeof price !== 'number' || isNaN(price) || price <= 0 || price > 100_000_000)
        return res.status(400).json({ error: "Գինը պետք է լինի դրական թիվ" });
      if (!code || typeof code !== 'string' || !code.trim() || code.length > 100)
        return res.status(400).json({ error: "Կոդը պարտադիր է (մինչ 100 նիշ)" });
      if (!VALID_CATEGORIES.includes(category))
        return res.status(400).json({ error: "Կատեգորիան սխալ է" });
      if (!image || typeof image !== 'string' || !image.trim())
        return res.status(400).json({ error: "Նկարի URL-ը պարտադիր է" });
      const safeMinQty = Math.max(1, Math.min(10000, parseInt(min_quantity) || 1));
      const result = await query(
        "INSERT INTO products (name, price, code, description, image, category, min_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [name.trim(), price, code.trim(), description || '', image.trim(), category, safeMinQty]
      );
      const id = isPostgres ? result.rows[0].id : (result as any).lastInsertRowid;
      res.json({ id });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      await query("DELETE FROM products WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/products/:id", requireAdmin, async (req, res) => {
    try {
      const { name, price, code, description, image, category, min_quantity } = req.body;
      const VALID_CATEGORIES = ['sneakers', 'slippers'];
      if (!name || typeof name !== 'string' || !name.trim() || name.length > 200)
        return res.status(400).json({ error: "Անվանումը պարտադիր է (մինչ 200 նիշ)" });
      if (typeof price !== 'number' || isNaN(price) || price <= 0 || price > 100_000_000)
        return res.status(400).json({ error: "Գինը պետք է լինի դրական թիվ" });
      if (!code || typeof code !== 'string' || !code.trim() || code.length > 100)
        return res.status(400).json({ error: "Կոդը պարտադիր է (մինչ 100 նիշ)" });
      if (!VALID_CATEGORIES.includes(category))
        return res.status(400).json({ error: "Կատեգորիան սխալ է" });
      if (!image || typeof image !== 'string' || !image.trim())
        return res.status(400).json({ error: "Նկարի URL-ը պարտադիր է" });
      const safeMinQty = Math.max(1, Math.min(10000, parseInt(min_quantity) || 1));
      await query(`
        UPDATE products 
        SET name = $1, price = $2, code = $3, description = $4, image = $5, category = $6, min_quantity = $7
        WHERE id = $8
      `, [name.trim(), price, code.trim(), description || '', image.trim(), category, safeMinQty, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/products/bulk-block", requireAdmin, async (req, res) => {
    try {
      const { ids, is_blocked } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "No IDs provided" });
      const safeIds = ids.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id) && id > 0);
      if (safeIds.length === 0) return res.status(400).json({ error: "Invalid IDs" });
      const blockedValue = isPostgres ? is_blocked : (is_blocked ? 1 : 0);
      for (const id of safeIds) {
        await query("UPDATE products SET is_blocked = $1 WHERE id = $2", [blockedValue, id]);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Promo Codes
  // Admin — ամբողջ ցուցակ (requireAdmin)
  app.get("/api/promo-codes", requireAdmin, async (req, res) => {
    try {
      const result = await query("SELECT * FROM promo_codes");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Public — ստուգել 1 կոնկրետ կոդ (discount_percent-ը return է անում, ցուցակ չէ)
  app.post("/api/promo-codes/validate", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ error: "Կոդը պարտադիր է" });
      }
      const result = await query(
        "SELECT discount_percent FROM promo_codes WHERE code = $1",
        [code.trim()]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Կոդը գոյություն չունի" });
      }
      res.json({ discount_percent: result.rows[0].discount_percent });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/promo-codes", requireAdmin, async (req, res) => {
    try {
      const { code, discount_percent } = req.body;
      const result = await query(
        "INSERT INTO promo_codes (code, discount_percent) VALUES ($1, $2) RETURNING id",
        [code, discount_percent]
      );
      const id = isPostgres ? result.rows[0].id : (result as any).lastInsertRowid;
      res.json({ id });
    } catch (e) {
      res.status(400).json({ error: "Code already exists or database error" });
    }
  });

  app.delete("/api/promo-codes/:id", requireAdmin, async (req, res) => {
    try {
      await query("DELETE FROM promo_codes WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const { customer_name, customer_phone, customer_address, items } = req.body;

      // Validation
      if (!customer_name || !customer_phone || !customer_address) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // ✅ Server-side price verification — client-ի price-ն անտեսել, DB-ից կարդալ
      const verifiedItems: { id: number; quantity: number; price: number }[] = [];
      for (const item of items) {
        // Quantity validation
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 9999) {
          return res.status(400).json({ error: `Անվավեր քանակ ապրանք ${item.id}-ի համար` });
        }
        const productResult = await query("SELECT price, is_blocked, min_quantity FROM products WHERE id = $1", [item.id]);
        if (productResult.rows.length === 0) {
          return res.status(400).json({ error: `Product ${item.id} not found` });
        }
        const product = productResult.rows[0];
        const isBlocked = isPostgres ? product.is_blocked : Boolean(product.is_blocked);
        if (isBlocked) {
          return res.status(400).json({ error: `Product ${item.id} is unavailable` });
        }
        const minQty = product.min_quantity || 1;
        if (item.quantity < minQty) {
          return res.status(400).json({ error: `Նվազ. քանակ ${minQty} է ապրանք ${item.id}-ի համար` });
        }
        verifiedItems.push({ id: item.id, quantity: item.quantity, price: product.price });
      }

      // Calculate real total server-side
      const real_total = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      
      if (isPostgres) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const orderResult = await client.query(
            "INSERT INTO orders (customer_name, customer_phone, customer_address, total_price) VALUES ($1, $2, $3, $4) RETURNING id",
            [customer_name, customer_phone, customer_address, real_total]
          );
          const orderId = orderResult.rows[0].id;
          for (const item of verifiedItems) {
            await client.query(
              "INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)",
              [orderId, item.id, item.quantity, item.price]
            );
          }
          await client.query('COMMIT');
          res.json({ id: orderId });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } else {
        const transaction = sqlite.transaction(() => {
          const orderResult = sqlite.prepare(
            "INSERT INTO orders (customer_name, customer_phone, customer_address, total_price) VALUES (?, ?, ?, ?)"
          ).run(customer_name, customer_phone, customer_address, real_total);
          const orderId = orderResult.lastInsertRowid;
          for (const item of verifiedItems) {
            sqlite.prepare(
              "INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)"
            ).run(orderId, item.id, item.quantity, item.price);
          }
          return orderId;
        });
        const orderId = transaction();
        res.json({ id: orderId });
      }
    } catch (error) {
      res.status(500).json({ error: "Order processing failed" });
    }
  });

  // POST /api/orders/list — fetch orders (requireAdmin middleware ստուգում է token-ը)
  app.post("/api/orders/list", requireAdmin, async (req, res) => {
    try {
      const ordersResult = await query("SELECT * FROM orders ORDER BY created_at DESC");
      const ordersWithItems = await Promise.all(ordersResult.rows.map(async (order: any) => {
        const itemsResult = await query(`
          SELECT oi.*, p.name, p.image, p.code 
          FROM order_items oi 
          JOIN products p ON oi.product_id = p.id 
          WHERE oi.order_id = $1
        `, [order.id]);
        return { ...order, items: itemsResult.rows };
      }));
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/orders/:id", requireAdmin, async (req, res) => {
    try {
      await query("DELETE FROM order_items WHERE order_id = $1", [req.params.id]);
      await query("DELETE FROM orders WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/orders", requireAdmin, async (req, res) => {
    try {
      await query("DELETE FROM order_items");
      await query("DELETE FROM orders");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin Auth & Settings
  app.get("/api/db-status", async (req, res) => {
    try {
      await query("SELECT 1");
      res.json({ 
        connected: true, 
        type: isPostgres ? "PostgreSQL (Supabase)" : "SQLite (Local)",
        isPostgres 
      });
    } catch (error) {
      res.json({ 
        connected: false, 
        type: isPostgres ? "PostgreSQL (Supabase)" : "SQLite (Local)",
        isPostgres,
        error: (error as Error).message
      });
    }
  });

  app.post("/api/admin/login", loginLimiter, async (req, res) => {
    try {
      const { password } = req.body;
      let currentPassHash = "";
      
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      if (adminPassResult.rows.length > 0) {
        currentPassHash = adminPassResult.rows[0].value;
      } else {
        return res.status(500).json({ error: "Admin settings not initialized" });
      }
      
      const isMatch = await bcrypt.compare(password, currentPassHash);
      if (isMatch) {
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");
        sessions.set(token, Date.now() + 8 * 60 * 60 * 1000); // 8 ժամ
        res.json({ success: true, token });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/change-password", loginLimiter, requireAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "Նոր գաղտնաբառը պետք է լինի առնվազն 6 նիշ" });
      }
      const hashedNew = await bcrypt.hash(newPassword, 10);
      await query("UPDATE admin_settings SET value = $1 WHERE key = 'password'", [hashedNew]);
      // Բոլոր session-ները invalidate անել — գաղտնաբառ փոփոխությունից հետո logout
      sessions.clear();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });


  // AI Assistant endpoint — Gemini API key server-side է, client-ն չի տեσнум
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: "Չափазанց шат AI request, спасեք:" },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });

  app.post("/api/ai", aiLimiter, async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "AI service not configured" });
      }

      const { message, history = [], products = [] } = req.body;
      if (!message || typeof message !== 'string' || !message.trim() || message.length > 2000) {
        return res.status(400).json({ error: "Invalid message" });
      }

      const systemInstruction = `Դուք "EdgSport" խանութի պрофессіонал AI оgnakann eq: 
Dzer npatakem e tal KONKRET ev JSHGRIT pataskanner kayjhi ogtagorcman veraberjal:

KAYJHI NPATAKE:
Kayjhe stexcvac e nra hamar, orpeszi dzer koxmic ardeny isx havanacd tesakanineры linen patarasт нахораrog:

KAREVОR ТЕGHЕКOUTJUNNER KAYJHI MАSIN:
1. Navigacia: Glxavor ejum semblox "Дitеl теsakanin" kojakы, duk ktesnеq "Sportayin Kosikner" ev "Hoghataper" bajinnerы:
2. Apranqi entрoutjun: Apranqy entrel hamar petq e semblel dra vra araka "Uxarаkel zambjux" kojaky:
3. Zambjuxi bajin: Гtnvum e kayjhi amenaverevum ej aji ankjunum:
4. Kisvеl Zambjuxov: Viber, WhatsApp ev Telegram kojakknerы hajtnjum en zambjuxum miajn ajna depqum, yerb ajtex arka e arnavasт mek apranq:
5. Patverи hastatel: Lracrek dasterы, semble "НАSTATEL PATVERY" ev zangaraharet haceatiroji het:
6. Promo kod: Нахатеsvac e zelchi hamar, petq e vertcel kayjhi adminnic:

Ahanc apranqner kayjhic: ${JSON.stringify(products.slice(0, 10))}

Khoseq miajn hajerenovm (Armeniaan): Egheq shad hshtаk:`;

      // Build contents for Gemini
      const contents: any[] = (history as any[])
        .filter((m: any) => m.content)
        .map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
      contents.push({ role: 'user', parts: [{ text: message.trim() }] });

      const geminiRes = await fetch(
        \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=\${apiKey}\`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 1024 }
          })
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("Gemini API error:", errText);
        return res.status(502).json({ error: "AI service error" });
      }

      const geminiData = await geminiRes.json() as any;
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      res.json({ text });
    } catch (error) {
      console.error("AI endpoint error:", error);
      res.status(500).json({ error: "AI service error" });
    }
  });

  // Health check + DB keepalive (cron-job.org-ի ping-ը կպահի server-ը և DB-ը արթուն)
  app.get("/health", async (req, res) => {
    let dbOk = false;
    try {
      // 3 վրկ timeout — Render-ի 30 վրկ limit-ից շատ կարճ, crash-ը կանխելու համար
      await Promise.race([
        query("SELECT 1"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 3000))
      ]);
      dbOk = true;
    } catch {
      // DB timeout կամ error — server-ը կենդանի է, DB-ն ոչ
    }
    res.status(200).json({ 
      status: "ok", 
      db: dbOk ? "connected" : "unavailable",
      timestamp: new Date().toISOString() 
    });
  });

  // Cart image upload — Cloudinary (persistent, works on Render)
  app.post("/api/upload-cart-image", uploadLimiter, async (req, res) => {
    try {
      const { image } = req.body;
      if (!image || !image.startsWith("data:image/png;base64,")) {
        return res.status(400).json({ error: "Invalid image data" });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey    = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({ error: "Cloudinary credentials not configured" });
      }

      const crypto = await import("crypto");
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = "cart-images";
      const sigStr = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(sigStr).digest("hex");

      const formData = new URLSearchParams();
      formData.append("file", image);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error("Cloudinary error:", errText);
        return res.status(500).json({ error: "Cloudinary upload failed" });
      }

      const data = await uploadRes.json() as { secure_url: string };
      res.json({ url: data.secure_url });
    } catch (err) {
      console.error("Image upload error:", err);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // HTML ֆայլեր — ԵՐԲԵՔ cache չանել
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // JS/CSS ֆայլեր — երկար cache (Vite-ը hash ավելացնում է անվան մեջ)
    else if (filePath.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Նկարներ
    else if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));
    app.get("*", (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = parseInt(process.env.PORT || "3000");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
