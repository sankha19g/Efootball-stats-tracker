-- eFootball Stats Tracker - MySQL Schema
-- Run this in your TiDB Cloud / MySQL instance to initialize the database

-- Users (keyed by Firebase UID)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Players (your personal squad)
CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(128) NOT NULL,
  name VARCHAR(255) NOT NULL,
  club VARCHAR(255),
  league VARCHAR(255),
  nationality VARCHAR(255),
  age INT,
  position VARCHAR(50) NOT NULL,
  secondary_position VARCHAR(50),
  additional_positions JSON,
  playstyle VARCHAR(100),
  pesdb_id VARCHAR(100),
  player_id VARCHAR(100),
  skills JSON,
  rating INT NOT NULL DEFAULT 0,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  matches INT DEFAULT 0,
  card_type VARCHAR(50) DEFAULT 'Normal',
  strong_foot VARCHAR(10),
  image TEXT,
  logo_club TEXT,
  logo_league TEXT,
  logo_country TEXT,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_players_user_id (user_id)
);

-- Player progression history (stat snapshots)
CREATE TABLE IF NOT EXISTS player_progressions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  player_id VARCHAR(36) NOT NULL,
  rating INT,
  goals INT,
  assists INT,
  matches INT,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Squads (saved formations/tactics)
CREATE TABLE IF NOT EXISTS squads (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(128) NOT NULL,
  name VARCHAR(255),
  formation VARCHAR(50),
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_squads_user_id (user_id)
);

-- Screenshots (ImgBB URLs stored here)
CREATE TABLE IF NOT EXISTS screenshots (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(128) NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_screenshots_user_id (user_id)
);

-- Links (user-saved links)
CREATE TABLE IF NOT EXISTS links (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(128) NOT NULL,
  title VARCHAR(255),
  url TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_links_user_id (user_id)
);

-- Apps (user-saved apps/tools)
CREATE TABLE IF NOT EXISTS apps (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(128) NOT NULL,
  name VARCHAR(255) NOT NULL,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_apps_user_id (user_id)
);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(128) NOT NULL,
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reminders_user_id (user_id)
);

-- Reminder item presets
CREATE TABLE IF NOT EXISTS reminder_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reminder_items_user_id (user_id)
);

-- Global player reference DB (manually added/scraped players beyond the JSON)
CREATE TABLE IF NOT EXISTS global_players (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255),
  search_name VARCHAR(255),
  position VARCHAR(50),
  card_type VARCHAR(100),
  rating INT,
  club VARCHAR(255),
  league VARCHAR(255),
  nationality VARCHAR(255),
  playstyle VARCHAR(100),
  skills JSON,
  image_url TEXT,
  data JSON,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_global_search_name (search_name),
  INDEX idx_global_name (name)
);
