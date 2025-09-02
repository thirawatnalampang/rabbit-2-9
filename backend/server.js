require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db'); // เชื่อมต่อฐานข้อมูล
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

/* ===================== Helpers (LOG & DIFF) ===================== */
const nowISO = () => new Date().toISOString();
// ฟิลด์ที่ยอมแสดงใน log (เลี่ยงข้อมูลอ่อนไหว)
const TRACK_FIELDS = ['username', 'email', 'phone', 'address', 'gender', 'profile_image'];
const show = (v) => {
  if (v === null || v === undefined) return 'null';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > 120 ? s.slice(0, 117) + '...' : s;
};
function diffUser(oldRow, newRow) {
  const diffs = [];
  for (const f of TRACK_FIELDS) {
    const o = oldRow?.[f] ?? null;
    const n = newRow?.[f] ?? null;
    if (String(o) !== String(n)) diffs.push({ field: f, oldVal: o, newVal: n });
  }
  return diffs;
}

/* ===================== Uploads ===================== */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

/* ===================== Nodemailer ===================== */
/** ใช้ Gmail + App Password (16 ตัว) */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,       // STARTTLS
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,     // ต้องเป็น App Password 16 ตัว “ติดกันไม่มีช่องว่าง”
  },
});

transporter.verify((err, ok) => {
  if (err) {
    console.error('SMTP verify failed:', {
      message: err.message, code: err.code, command: err.command, response: err.response,
    });
  } else {
    console.log('SMTP ready:', ok);
  }
});

/* ===================== OTP Store (in-memory) ===================== */
// โครงสร้าง: { [email]: { code, expireAt, lastSentAt } }
const otpStore = {};
const OTP_EXPIRE_MIN = Number(process.env.OTP_EXPIRE_MIN || 10);
const OTP_EXPIRE_MS = OTP_EXPIRE_MIN * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const now = () => Date.now();
const cleanupOtp = (email) => delete otpStore[email];

/* ===================== Upload รูปโปรไฟล์ (อัปโหลดไฟล์) ===================== */
app.post('/api/upload', upload.single('profileImage'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ไม่มีไฟล์ถูกอัปโหลด' });
  const url = `http://localhost:${port}/uploads/${req.file.filename}`;
  res.json({ url });
});

/* ===================== Rabbits ===================== */
app.get('/api/rabbits', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rabbits ORDER BY rabbit_id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching rabbits:', err.message);
    res.status(500).json({ error: 'Failed to fetch rabbits' });
  }
});

app.get('/api/rabbits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // แก้ให้ตรงคีย์จริงในตาราง
    const result = await pool.query('SELECT * FROM rabbits WHERE rabbit_id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rabbit not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rabbit' });
  }
});

app.post('/api/rabbits', async (req, res) => {
  const { seller_id, name, breed, age, gender, price, description, image_url, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO rabbits (seller_id, name, breed, age, gender, price, description, image_url, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [seller_id, name, breed, age, gender, price, description, image_url, status]
    );
    res.status(201).json({ message: 'Rabbit added', rabbit: result.rows[0] });
  } catch (err) {
    console.error('❌ Failed to add rabbit:', err.message);
    res.status(500).json({ error: 'Failed to add rabbit' });
  }
});

app.put('/api/rabbits/:id', async (req, res) => {
  const { id } = req.params;
  const { seller_id, name, breed, age, gender, price, description, image_url, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rabbits
       SET seller_id=$1, name=$2, breed=$3, age=$4, gender=$5, price=$6, description=$7, image_url=$8, status=$9
       WHERE rabbit_id=$10
       RETURNING *`,
      [seller_id, name, breed, age, gender, price, description, image_url, status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rabbit not found' });
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
    if (result.rowCount === 0) return res.status(404).json({ error: 'Rabbit not found' });
    res.json({ message: 'Rabbit deleted' });
  } catch (err) {
    console.error('❌ Failed to delete rabbit:', err.message);
    res.status(500).json({ error: 'Failed to delete rabbit' });
  }
});

/* ===================== OTP API ===================== */
// ส่ง OTP ไปอีเมล
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'กรุณาส่งอีเมล' });

    // กันสแปม (คูลดาวน์ 60 วิ)
    const record = otpStore[email];
    if (record && record.lastSentAt && (now() - record.lastSentAt) < OTP_COOLDOWN_MS) {
      const waitMs = OTP_COOLDOWN_MS - (now() - record.lastSentAt);
      const waitSec = Math.ceil(waitMs / 1000);
      res.set('Retry-After', String(waitSec));
      return res.status(429).json({ message: `โปรดรอ ${waitSec} วินาที แล้วลองส่งใหม่อีกครั้ง`, retry_after: waitSec });
    }

    // สร้างและเก็บ OTP
    const code = genOtp();
    otpStore[email] = { code, expireAt: now() + OTP_EXPIRE_MS, lastSentAt: now() };

    // ส่งเมล
    try {
      const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to: email,
        subject: 'รหัสยืนยันการสมัครสมาชิก (OTP)',
        text: `รหัส OTP ของคุณคือ ${code} (หมดอายุภายใน ${OTP_EXPIRE_MIN} นาที)`,
        html: `<p>รหัส OTP: <b style="font-size:20px">${code}</b></p><p>หมดอายุใน ${OTP_EXPIRE_MIN} นาที</p>`,
      });
      console.log('sendMail OK:', { messageId: info.messageId });
    } catch (sendErr) {
      console.error('sendMail FAILED:', {
        message: sendErr.message, code: sendErr.code, command: sendErr.command, response: sendErr.response,
      });
      return res.status(500).json({ message: 'ส่ง OTP ไม่สำเร็จ' });
    }

    // โหมด dev: ส่ง dev_otp กลับมาด้วยเพื่อเทสง่าย (อย่าเปิดในโปรดักชัน)
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ message: 'ส่ง OTP ไปที่อีเมลแล้ว', dev_otp: otpStore[email].code });
    }
    return res.json({ message: 'ส่ง OTP ไปที่อีเมลแล้ว' });
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ message: 'ส่ง OTP ไม่สำเร็จ' });
  }
});

/* ===================== Users ===================== */
// ดึง users ทั้งหมด
app.get('/api/users', async (_req, res) => {
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

// helper ไว้พิมพ์เวลา (สำหรับ log register/login ด้านล่าง)
const nowISO_log = () => new Date().toISOString();

/* ===================== REGISTER ===================== */
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, otp } = req.body;

    // Log ข้อมูลที่ส่งมา (ไม่เก็บ password/otp)
    console.log(`[REGISTER ATTEMPT] username:${username}, email:${email}, time:${nowISO_log()}`);

    if (!username || !password || !email || !otp) {
      return res.status(400).json({ message: 'กรุณากรอก username, password, email และ otp ให้ครบ' });
    }

    // ตรวจ OTP
    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: 'ยังไม่ได้ส่ง OTP หรือ OTP หมดอายุ' });
    if (now() > record.expireAt) { cleanupOtp(email); return res.status(400).json({ message: 'OTP หมดอายุ กรุณาขอรหัสใหม่' }); }
    if (String(otp) !== String(record.code)) return res.status(400).json({ message: 'OTP ไม่ถูกต้อง' });

    // ตรวจซ้ำ
    const existing = await pool.query('SELECT 1 FROM users WHERE username=$1 OR email=$2', [username, email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้แล้ว' });

    // แฮชรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // บันทึก user
    const result = await pool.query(
      `INSERT INTO users (username, password, email, phone, address, gender, role, profile_image, email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING user_id`,
      [username, hashedPassword, email, null, null, null, 'user', null, true]
    );

    cleanupOtp(email);

    const newUserId = result.rows[0].user_id;
    console.log(`[REGISTER SUCCESS] New user registered: ${username} (user_id: ${newUserId}) at ${nowISO_log()}`);

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

/* ===================== LOGIN ===================== */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`[LOGIN ATTEMPT] username:${username}, time:${nowISO_log()}`);

    if (!username || !password) {
      console.log(`[LOGIN FAIL] username:${username}, reason:missing_fields, time:${nowISO_log()}`);
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      console.log(`[LOGIN FAIL] username:${username}, reason:user_not_found, time:${nowISO_log()}`);
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = userResult.rows[0];

    // ผู้ใช้ทั่วไปต้องยืนยันอีเมลก่อน (admin ข้ามได้)
    if (user.role !== 'admin' && user.email_verified === false) {
      console.log(`[LOGIN FAIL] username:${username}, user_id:${user.user_id}, reason:email_not_verified, time:${nowISO_log()}`);
      return res.status(403).json({ message: 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ' });
    }

    // ตรวจรหัสผ่าน (admin รองรับ plain-text เก่า + bcrypt)
    let match = false;
    if (user.role === 'admin') {
      match = password === user.password || await bcrypt.compare(password, user.password);
    } else {
      match = await bcrypt.compare(password, user.password);
    }
    if (!match) {
      console.log(`[LOGIN FAIL] username:${username}, user_id:${user.user_id}, reason:password_incorrect, time:${nowISO_log()}`);
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    console.log(`[LOGIN SUCCESS] ${user.username} (user_id: ${user.user_id}, role: ${user.role}) at ${nowISO_log()}`);

    res.json({
      message: 'ล็อกอินสำเร็จ',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profile_image: user.profile_image,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    console.log(`[LOGIN FAIL] username:${req.body?.username}, reason:server_error, time:${nowISO_log()}`);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

/* ===================== UPDATE PROFILE (with DIFF LOG) ===================== */
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, email, phone, address, gender, profileImage } = req.body;

  try {
    // ดึงของเดิมมาเพื่อเทียบ diff
    const beforeRes = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
    if (beforeRes.rows.length === 0) {
      console.log(`[PROFILE UPDATE FAIL] user_id:${id}, reason:not_found, time:${nowISO()}`);
      return res.status(404).json({ error: 'User not found' });
    }
    const before = beforeRes.rows[0];

    const result = await pool.query(
      `UPDATE users 
       SET username=$1, email=$2, phone=$3, address=$4, gender=$5, profile_image=$6
       WHERE user_id=$7 
       RETURNING *`,
      [username || null, email || null, phone || null, address || null, gender || null, profileImage || null, id]
    );

    const after = result.rows[0];

    // สร้างบรรทัด log แสดง field ที่เปลี่ยน และค่าใหม่
    const changes = diffUser(before, after);
    if (changes.length === 0) {
      console.log(`[PROFILE UPDATE] user_id:${id}, changed:none, time:${nowISO()}`);
    } else {
      const parts = changes.map(c => `${c.field}:{${show(c.oldVal)} -> ${show(c.newVal)}}`);
      console.log(`[PROFILE UPDATE] user_id:${id}, changed:${parts.join(', ')}, time:${nowISO()}`);
    }

    res.json(after);
  } catch (err) {
    console.error('❌ Failed to update user:', err);
    console.log(`[PROFILE UPDATE FAIL] user_id:${id}, reason:server_error, time:${nowISO()}`);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/* ===================== UPDATE PROFILE IMAGE (LOG) ===================== */
app.post('/api/users/:id/profile-image', async (req, res) => {
  const { id } = req.params;
  const { profileImage } = req.body;

  try {
    const result = await pool.query(
      'UPDATE users SET profile_image=$1 WHERE user_id=$2 RETURNING *',
      [profileImage, id]
    );

    if (result.rowCount === 0) {
      console.log(`[PROFILE IMAGE UPDATE FAIL] user_id:${id}, reason:not_found, time:${nowISO()}`);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[PROFILE IMAGE UPDATE] user_id:${id}, new_image:${show(profileImage)}, time:${nowISO()}`);

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
    console.log(`[PROFILE IMAGE UPDATE FAIL] user_id:${id}, reason:server_error, time:${nowISO()}`);
    res.status(500).json({ error: 'Failed to update profile image' });
  }
});

/* ===================== Delete user ===================== */
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

/* ===================== Start server ===================== */
app.listen(port, () => {
  console.log(`🐰 Server running at http://localhost:${port}`);
});
