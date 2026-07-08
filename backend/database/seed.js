// Populates the database with one login per role and two sample events with seats.
// Run with: npm run seed   (after schema.sql has been applied)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const DEMO_PASSWORD = 'Password123!';

const demoUsers = [
  { full_name: 'Abebe Fan', email: 'fan@example.com', role: 'fan', phone: '0911000001' },
  { full_name: 'Sara Box Office', email: 'boxoffice@example.com', role: 'box_office_staff', phone: '0911000002' },
  { full_name: 'Getu Gatekeeper', email: 'gate@example.com', role: 'gate_scanner_officer', phone: '0911000003' },
  { full_name: 'Admin Officer', email: 'admin@example.com', role: 'stadium_admin', phone: '0911000004' },
  { full_name: 'Commission Auditor', email: 'commission@example.com', role: 'sport_commission_officer', phone: '0911000005' }
];

const SECTIONS = [
  { name: 'VIP', rows: 2, seatsPerRow: 8, price: 1500 },
  { name: 'Regular', rows: 6, seatsPerRow: 12, price: 500 }
];

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('Seeding users...');
    const userIds = {};
    for (const u of demoUsers) {
      const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
      const [existing] = await conn.query('SELECT user_id FROM users WHERE email = ?', [u.email]);
      if (existing.length) {
        userIds[u.role] = existing[0].user_id;
        console.log(`  - ${u.email} already exists, skipping`);
        continue;
      }
      const [result] = await conn.query(
        'INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
        [u.full_name, u.email, u.phone, hashed, u.role]
      );
      userIds[u.role] = result.insertId;
      console.log(`  - created ${u.role}: ${u.email} / ${DEMO_PASSWORD}`);
    }

    console.log('Seeding events...');
    const events = [
      {
        event_name: 'Dire Dawa City FC vs Ethiopia Bunna FC',
        home_team: 'Dire Dawa City FC',
        away_team: 'Ethiopia Bunna FC',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        venue: 'Dire Dawa Stadium'
      },
      {
        event_name: 'Dire Dawa City FC vs Adama Kenema FC',
        home_team: 'Dire Dawa City FC',
        away_team: 'Adama Kenema FC',
        event_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        venue: 'Dire Dawa Stadium'
      }
    ];

    for (const ev of events) {
      const [existing] = await conn.query('SELECT event_id FROM events WHERE event_name = ?', [ev.event_name]);
      let eventId;
      if (existing.length) {
        eventId = existing[0].event_id;
        console.log(`  - "${ev.event_name}" already exists, skipping seat generation`);
        continue;
      }
      const [result] = await conn.query(
        'INSERT INTO events (event_name, home_team, away_team, event_date, venue, status, created_by) VALUES (?, ?, ?, ?, ?, "scheduled", ?)',
        [ev.event_name, ev.home_team, ev.away_team, ev.event_date, ev.venue, userIds.stadium_admin]
      );
      eventId = result.insertId;
      console.log(`  - created event: ${ev.event_name} (#${eventId})`);

      for (const section of SECTIONS) {
        for (let r = 1; r <= section.rows; r++) {
          const rowLetter = String.fromCharCode(64 + r); // A, B, C ...
          for (let s = 1; s <= section.seatsPerRow; s++) {
            await conn.query(
              'INSERT INTO seats (event_id, section, seat_number, price, status) VALUES (?, ?, ?, ?, "available")',
              [eventId, section.name, `${rowLetter}${s}`, section.price]
            );
          }
        }
      }
      console.log(`    -> generated seats for ${SECTIONS.map(s => s.name).join(', ')}`);
    }

    console.log('\nSeed complete. Demo logins (all use password: ' + DEMO_PASSWORD + '):');
    demoUsers.forEach(u => console.log(`  ${u.role.padEnd(24)} ${u.email}`));
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
