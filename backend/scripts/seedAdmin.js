const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function seedAdmin() {
  try {
    const email = 'admin@eduresearch.com';
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (rows.length) {
      console.log('✅ Admin already exists:', email);
      process.exit(0);
    }

    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'ChangeMe123!';
    
    if (!process.env.ADMIN_INITIAL_PASSWORD && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  SECURITY WARNING: ADMIN_INITIAL_PASSWORD not provided in production!');
    }

    const salt = bcrypt.genSaltSync(12);
    const hash = bcrypt.hashSync(initialPassword, salt);

    await query(
      `INSERT INTO users (name, email, password, role, unit) VALUES ($1, $2, $3, $4, $5)`,
      ['Admin Tối Cao', email, hash, 'admin', 'Ban Giám Đốc']
    );

    console.log('✅ Admin created:', email);
    console.log('🔑 Initial password set (change immediately after first login)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed admin failed:', err);
    process.exit(1);
  }
}

seedAdmin();