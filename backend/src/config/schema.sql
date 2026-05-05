-- =============================================
-- Script SQL - SabanaMarket
-- Ejecuta esto en tu base de datos PostgreSQL
-- =============================================

-- CREATE DATABASE sabanamarket;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password      TEXT NOT NULL,
  carrera       VARCHAR(100),
  foto_url      TEXT,
  rol           VARCHAR(20) DEFAULT 'comprador',
  is_vendedor   BOOLEAN DEFAULT false,
  reputacion    DECIMAL(3,2) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Tabla de productos (PROD-03)
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  owner_id      INTEGER NOT NULL REFERENCES users(id),
  titulo        VARCHAR(200) NOT NULL,
  descripcion   TEXT NOT NULL,
  precio        DECIMAL(10,2) NOT NULL CHECK (precio > 0),
  categoria     VARCHAR(50) NOT NULL,
  estado        VARCHAR(10) NOT NULL CHECK (estado IN ('nuevo', 'usado')),
  imagenes      TEXT[] DEFAULT '{}',
  activo        BOOLEAN DEFAULT true,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Indices para busquedas rapidas
CREATE INDEX IF NOT EXISTS idx_products_owner     ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_products_activo    ON products(activo);
