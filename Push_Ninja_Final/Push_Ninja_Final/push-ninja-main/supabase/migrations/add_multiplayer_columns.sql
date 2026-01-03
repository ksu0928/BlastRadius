-- Push Ninja Multiplayer Schema Migration
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. Add new columns to games table
-- =====================================================

-- Add room_type column (public/private)
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'public';

-- Add room_code column for private games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS room_code TEXT;

-- Add win_type column (normal/forfeit)
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS win_type TEXT;

-- =====================================================
-- 2. Create index for efficient room code lookups
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_games_room_code 
ON games(room_code) 
WHERE room_code IS NOT NULL;

-- Create index for available public games
CREATE INDEX IF NOT EXISTS idx_games_public_waiting 
ON games(state, room_type) 
WHERE state = 0 AND room_type = 'public';

-- =====================================================
-- 3. Update game state comments
-- =====================================================
-- Game States:
-- 0 = WAITING
-- 1 = IN_PROGRESS
-- 2 = FINISHED
-- 3 = CANCELLED
-- 4 = FORFEITED (NEW)

COMMENT ON COLUMN games.state IS 'Game state: 0=WAITING, 1=IN_PROGRESS, 2=FINISHED, 3=CANCELLED, 4=FORFEITED';
COMMENT ON COLUMN games.room_type IS 'Room type: public or private';
COMMENT ON COLUMN games.room_code IS '6-character join code for private rooms';
COMMENT ON COLUMN games.win_type IS 'Win type: normal (98% of pool) or forfeit (1.5x)';

-- =====================================================
-- 4. Update RLS policies if needed
-- =====================================================

-- Allow reading public games
CREATE POLICY IF NOT EXISTS "Allow reading public games" ON games
FOR SELECT USING (room_type = 'public' OR auth.uid() IS NOT NULL);

-- =====================================================
-- 5. Verify the changes
-- =====================================================
-- Run this to verify columns were added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'games';
