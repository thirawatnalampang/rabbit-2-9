const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db'); // เชื่อมต่อฐานข้อมูล
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;
const bcrypt = require('bcrypt');

app.use(bodyParser.json());

// ตั้งค่าเก็บไฟล์อัปโหลด
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Serve static files ในโฟลเดอร์ uploads
app.use('/uploads', express.static(uploadDir));

// API อัปโหลดรูปโปรไฟล์
app.post('/api/upload', upload.single('profileImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ไม่มีไฟล์ถูกอัปโหลด' });
  }
  const url = `http://localhost:${port}/uploads/${req.file.filename}`;
  res.json({ url });
});

app.get('/api/rabbits', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rabbits ORDER BY rabbit_id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching rabbits:', err.message); // <--- เพิ่ม log ชัดๆ
    res.status(500).json({ error: 'Failed to fetch rabbits' });
  }
});

/** ───── [2] GET: ดึงกระต่ายตาม id ───── */
app.get('/api/rabbits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM rabbits WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rabbit not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rabbit' });
  }
});
app.post('/api/rabbits', async (req, res) => {
  const {
    seller_id,
    name,
    breed,
    age,
    gender,
    price,
    description,
    image_url,
    status
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO rabbits (seller_id, name, breed, age, gender, price, description, image_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [seller_id, name, breed, age, gender, price, description, image_url, status]
    );

    res.status(201).json({ message: 'Rabbit added', rabbit: result.rows[0] });
  } catch (err) {
    console.error('❌ Failed to add rabbit:', err.message);
    res.status(500).json({ error: 'Failed to add rabbit' });
  }
});

/** ───── [4] PUT: แก้ไขกระต่ายตาม id ───── */
app.put('/api/rabbits/:id', async (req, res) => {
  const { id } = req.params;
  const {
    seller_id,
    name,
    breed,
    age,
    gender,
    price,
    description,
    image_url,
    status
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE rabbits 
       SET seller_id = $1, name = $2, breed = $3, age = $4, gender = $5, price = $6, description = $7, image_url = $8, status = $9
       WHERE rabbit_id = $10
       RETURNING *`,
      [seller_id, name, breed, age, gender, price, description, image_url, status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Rabbit not found' });
    }

    res.json({ message: 'Rabbit updated', rabbit: result.rows[0] });
  } catch (err) {
    console.error('❌ Failed to update rabbit:', err.message);
    res.status(500).json({ error: 'Failed to update rabbit' });
  }
});

app.delete('/api/rabbits/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM rabbits WHERE rabbit_id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Rabbit not found' });
    }
    res.json({ message: 'Rabbit deleted' });
  } catch (err) {
    console.error('❌ Failed to delete rabbit:', err.message); // เพิ่ม log ดู error จริง
    res.status(500).json({ error: 'Failed to delete rabbit' });
  }
});

/** ───── Start server ───── */
app.listen(port, () => {
  console.log(`🐰 Server running at http://localhost:${port}`);
});

// --- API ผู้ใช้ (User CRUD) ---
// ดึง users ทั้งหมด
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY user_id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ดึง user ตาม id
app.get('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error fetching user:', err.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    console.log(`[REGISTER ATTEMPT] username: ${username}, email: ${email}, time: ${new Date().toISOString()}`);

    if (!username || !password || !email) {
      console.log(`[REGISTER FAILED] Missing fields at ${new Date().toISOString()}`);
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    // เช็ค username ซ้ำ
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      console.log(`[REGISTER FAILED] Username already exists: ${username} at ${new Date().toISOString()}`);
      return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // เพิ่ม user ใหม่
    const result = await pool.query(
      `INSERT INTO users 
        (username, password, email, phone, address, gender, role, profile_image) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id`,
      [username, hashedPassword, email, null, null, null, 'user', null]
    );

    const newUserId = result.rows[0].user_id;
    console.log(`[REGISTER SUCCESS] New user registered: ${username} (user_id: ${newUserId}) at ${new Date().toISOString()}`);

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log(`[LOGIN FAILED] Missing username or password at ${new Date().toISOString()}`);
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      console.log(`[LOGIN FAILED] Username not found: ${username} at ${new Date().toISOString()}`);
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = userResult.rows[0];
    let match = false;

    // ✅ เช็ค role
    if (user.role === 'admin') {
      // admin ไม่ใช้ hash → เช็คตรง ๆ
      match = password === user.password;
    } else {
      // user ธรรมดา → ใช้ bcrypt.compare
      match = await bcrypt.compare(password, user.password);
    }

    if (!match) {
      console.log(`[LOGIN FAILED] Wrong password for user: ${username} (user_id: ${user.user_id}) at ${new Date().toISOString()}`);
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    console.log(`[LOGIN SUCCESS] User: ${username} (user_id: ${user.user_id}) logged in at ${new Date().toISOString()}`);

    res.json({
      message: 'ล็อกอินสำเร็จ',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profile_image: user.profile_image, // ✅ ระวังชื่อตรง DB ใช้ snake_case
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, address, gender, profileImage } = req.body;

  //console.log('Received gender:', gender);  // <-- เพิ่มดูว่ารับค่าถูกไหม

  try {
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, email = $2, phone = $3, address = $4, gender = $5, profile_image = $6 
       WHERE user_id = $7 
       RETURNING *`,
      [
        username || null,
        email || null,
        phone || null,
        address || null,
        gender || null,  // <-- เช็คตรงนี้ว่าค่าส่งมาถูกไหม
        profileImage || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Updated user:', result.rows[0]); // <-- ดูค่าที่ได้จาก DB

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Failed to update user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});
// อัปเดตรูปโปรไฟล์เฉพาะ
app.post('/api/users/:id/profile-image', async (req, res) => {
  const { id } = req.params;
  const { profileImage } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET profile_image = $1 WHERE user_id = $2 RETURNING *',
      [profileImage, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile image updated',
      user: {
        user_id: result.rows[0].user_id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        phone: result.rows[0].phone,
        address: result.rows[0].address,
        profileImage: result.rows[0].profile_image,
      },
    });
  } catch (err) {
    console.error('❌ Failed to update profile image:', err.message);
    res.status(500).json({ error: 'Failed to update profile image' });
  }
});

// ลบ user ตาม id
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('❌ Failed to delete user:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});