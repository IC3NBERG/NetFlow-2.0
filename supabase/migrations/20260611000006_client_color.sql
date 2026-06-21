-- Migration: 006_client_color
-- Description: Add color column to clients table
-- Date: 2026-06-11

ALTER TABLE clients ADD COLUMN IF NOT EXISTS color text;
