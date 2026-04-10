import express from "express";
import { createServer as createViteServer } from "vite";
import pkg from "pg";
const { Pool } = pkg;
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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

  // Set default admin password if not exists
  const adminPass = await query("SELECT value FROM admin_settings WHERE key = 'password'");
  if (adminPass.rowCount === 0) {
    await query("INSERT INTO admin_settings (key, value) VALUES ('password', 'admin123')");
  }
}

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
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  
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

  app.post("/api/products", async (req, res) => {
    try {
      const { name, price, code, description, image, category, min_quantity, password } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];
      
      if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });

      const result = await query(
        "INSERT INTO products (name, price, code, description, image, category, min_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [name, price, code, description, image, category, min_quantity || 1]
      );
      
      const id = isPostgres ? result.rows[0].id : (result as any).lastInsertRowid;
      res.json({ id });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];
      
      if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });

      await query("DELETE FROM products WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { name, price, code, description, image, category, min_quantity, password } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];
      
      if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });

      await query(`
        UPDATE products 
        SET name = $1, price = $2, code = $3, description = $4, image = $5, category = $6, min_quantity = $7
        WHERE id = $8
      `, [name, price, code, description, image, category, min_quantity || 1, req.params.id]);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Bulk block/unblock products
  app.post("/api/products/bulk-block", async (req, res) => {
    try {
      const { ids, is_blocked, password } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];

      if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "No IDs provided" });

      const blockedValue = isPostgres ? is_blocked : (is_blocked ? 1 : 0);

      for (const id of ids) {
        await query("UPDATE products SET is_blocked = $1 WHERE id = $2", [blockedValue, id]);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Promo Codes
  app.get("/api/promo-codes", async (req, res) => {
    try {
      const result = await query("SELECT * FROM promo_codes");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/promo-codes", async (req, res) => {
    try {
      const { code, discount_percent, password } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];
      
      if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });

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

  app.delete("/api/promo-codes/:id", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];
      
      if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });

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
        const productResult = await query("SELECT price, is_blocked FROM products WHERE id = $1", [item.id]);
        if (productResult.rows.length === 0) {
          return res.status(400).json({ error: `Product ${item.id} not found` });
        }
        const product = productResult.rows[0];
        const isBlocked = isPostgres ? product.is_blocked : Boolean(product.is_blocked);
        if (isBlocked) {
          return res.status(400).json({ error: `Product ${item.id} is unavailable` });
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

  // Shared handler for fetching orders (used by both GET legacy and POST secure)
  const handleFetchOrders = async (password: string | undefined, res: any) => {
    const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
    const currentPass = adminPassResult.rows[0];
    if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });
    const ordersResult = await query("SELECT * FROM orders ORDER BY created_at DESC");
    const orders = ordersResult.rows;
    const ordersWithItems = await Promise.all(orders.map(async (order: any) => {
      const itemsResult = await query(`
        SELECT oi.*, p.name, p.image, p.code 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = $1
      `, [order.id]);
      return { ...order, items: itemsResult.rows };
    }));
    res.json(ordersWithItems);
  };

  // POST /api/orders — fetch orders (password in body, secure)
  // Note: POST with _method:'GET' is used by the frontend for secure password passing
  // This route must be BEFORE the generic POST /api/orders handler above won't conflict
  // because this one checks for _method:'GET' flag
  app.post("/api/orders/list", async (req, res) => {
    try {
      await handleFetchOrders(req.body.password, res);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // GET /api/orders — kept for backward compatibility only
  app.get("/api/orders", async (req, res) => {
    try {
      await handleFetchOrders(req.query.password as string, res);
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];
      
      if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });

      await query("DELETE FROM order_items WHERE order_id = $1", [req.params.id]);
      await query("DELETE FROM orders WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.delete("/api/orders", async (req, res) => {
    try {
      const { password } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];
      
      if (password !== currentPass.value) return res.status(401).json({ error: "Unauthorized" });

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

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      let currentPass = "admin123";
      
      try {
        const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
        if (adminPassResult.rows.length > 0) {
          currentPass = adminPassResult.rows[0].value;
        }
      } catch (dbError) {
        console.error("Login DB fallback triggered:", dbError);
      }
      
      if (password === currentPass) {
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/admin/change-password", async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const adminPassResult = await query("SELECT value FROM admin_settings WHERE key = 'password'");
      const currentPass = adminPassResult.rows[0];
      
      if (oldPassword === currentPass.value) {
        await query("UPDATE admin_settings SET value = $1 WHERE key = 'password'", [newPassword]);
        res.json({ success: true });
      } else {
        res.status(401).json({ error: "Invalid old password" });
      }
    } catch (error) {
      res.status(500).json({ error: "Database error" });
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
  app.post("/api/upload-cart-image", async (req, res) => {
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
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = parseInt(process.env.PORT || "3000");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
