-- Schema migrations for Quickagenda
-- Add description column to event table for storing optional event description
ALTER TABLE event ADD COLUMN IF NOT EXISTS description TEXT;
