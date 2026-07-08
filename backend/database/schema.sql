-- Stadium Ticket Reservation System
-- Schema derived from Chapter 4.8 (Persistent Data Storage and Management) of the project thesis.
-- A few fields are added beyond the thesis tables where the thesis text implies them but the
-- ERD omits them (seat pricing for "zone pricing", lock_expires_at for the seat-lock requirement
-- FR-2.2) -- these are noted inline.

CREATE DATABASE IF NOT EXISTS stadium_ticket_system;
USE stadium_ticket_system;

-- ---------------------------------------------------------------------------
-- USER  (Table 19)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id     INT AUTO_INCREMENT PRIMARY KEY,
  full_name   VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  phone       VARCHAR(30)  NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('fan','box_office_staff','gate_scanner_officer','stadium_admin','sport_commission_officer')
              NOT NULL DEFAULT 'fan',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- EVENT  (Table 20)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  event_id    INT AUTO_INCREMENT PRIMARY KEY,
  event_name  VARCHAR(150) NOT NULL,
  home_team   VARCHAR(100) NULL,
  away_team   VARCHAR(100) NULL,
  event_date  DATETIME NOT NULL,
  venue       VARCHAR(150) NOT NULL DEFAULT 'Dire Dawa Stadium',
  status      ENUM('scheduled','ongoing','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  created_by  INT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- SEAT  (Table 21)
-- price / lock_expires_at added: the thesis's "zone pricing" (FR-4.1) and seat-lock
-- (FR-2.2) requirements need somewhere to live; the ERD's Seat table is the natural place.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seats (
  seat_id         INT AUTO_INCREMENT PRIMARY KEY,
  event_id        INT NOT NULL,
  section         VARCHAR(50) NOT NULL,
  seat_number     VARCHAR(20) NOT NULL,
  price           DECIMAL(10,2) NOT NULL DEFAULT 0,
  status          ENUM('available','locked','reserved','blocked') NOT NULL DEFAULT 'available',
  lock_expires_at DATETIME NULL,
  FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
  UNIQUE KEY uniq_event_seat (event_id, section, seat_number)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- RESERVATION  (Table 22)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  reservation_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  event_id         INT NOT NULL,
  seat_id          INT NOT NULL,
  reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status           ENUM('pending','confirmed','cancelled','expired') NOT NULL DEFAULT 'pending',
  created_by_role  ENUM('fan','box_office_staff') NOT NULL DEFAULT 'fan',
  FOREIGN KEY (user_id)  REFERENCES users(user_id),
  FOREIGN KEY (event_id) REFERENCES events(event_id),
  FOREIGN KEY (seat_id)  REFERENCES seats(seat_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- PAYMENT  (Table 23)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  payment_id        INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id    INT NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  -- 'cash' added alongside the thesis's Telebirr/CBE Birr (Table 23) to cover the
  -- Box Office Staff walk-in sale path described in CRC Table 9.
  payment_method    ENUM('telebirr','cbe_birr','cash') NOT NULL,
  reference_number  VARCHAR(100) NOT NULL,
  payment_date      DATETIME DEFAULT CURRENT_TIMESTAMP,
  status            ENUM('success','failed','pending') NOT NULL DEFAULT 'pending',
  FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- TICKET  (Table 24)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  ticket_id       INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id  INT NOT NULL,
  qr_code         VARCHAR(255) NOT NULL UNIQUE,
  ticket_status   ENUM('active','scanned','expired','cancelled') NOT NULL DEFAULT 'active',
  issued_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- ATTENDANCE  (Table 25)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id  INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id      INT NOT NULL,
  entry_time     DATETIME DEFAULT CURRENT_TIMESTAMP,
  status         ENUM('entered','denied') NOT NULL DEFAULT 'entered',
  FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
) ENGINE=InnoDB;

-- Helpful indexes for the report queries (sales summary / attendance report).
CREATE INDEX idx_reservations_event ON reservations(event_id);
CREATE INDEX idx_seats_event_status ON seats(event_id, status);
CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_tickets_reservation ON tickets(reservation_id);
