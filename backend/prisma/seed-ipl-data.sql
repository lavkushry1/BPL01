-- IPL 2026 Seed Data SQL Script
-- Run this in Docker: docker exec -i backend-postgres-1 psql -U postgres -d eventia < prisma/seed-ipl-data.sql

-- Create IPL Venues
INSERT INTO ipl_venues (id, name, short_name, city, state, capacity, image_url, created_at, updated_at)
VALUES
  ('venue-chennai', 'M. A. Chidambaram Stadium', 'Chepauk', 'Chennai', 'Tamil Nadu', 50000, '/venues/chepauk.jpg', NOW(), NOW()),
  ('venue-mumbai', 'Wankhede Stadium', 'Wankhede', 'Mumbai', 'Maharashtra', 33000, '/venues/wankhede.jpg', NOW(), NOW()),
  ('venue-bengaluru', 'M. Chinnaswamy Stadium', 'Chinnaswamy', 'Bengaluru', 'Karnataka', 40000, '/venues/chinnaswamy.jpg', NOW(), NOW()),
  ('venue-kolkata', 'Eden Gardens', 'Eden Gardens', 'Kolkata', 'West Bengal', 68000, '/venues/eden.jpg', NOW(), NOW()),
  ('venue-delhi', 'Arun Jaitley Stadium', 'Feroz Shah Kotla', 'Delhi', 'Delhi', 41000, '/venues/kotla.jpg', NOW(), NOW()),
  ('venue-hyderabad', 'Rajiv Gandhi International Cricket Stadium', 'Uppal Stadium', 'Hyderabad', 'Telangana', 55000, '/venues/uppal.jpg', NOW(), NOW()),
  ('venue-ahmedabad', 'Narendra Modi Stadium', 'Motera', 'Ahmedabad', 'Gujarat', 132000, '/venues/motera.jpg', NOW(), NOW()),
  ('venue-jaipur', 'Sawai Mansingh Stadium', 'SMS Stadium', 'Jaipur', 'Rajasthan', 30000, '/venues/sms.jpg', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create IPL Teams
INSERT INTO ipl_teams (id, name, "shortName", home_city, primary_color, secondary_color, logo_url, founded_year, home_venue_id, created_at, updated_at)
VALUES
  ('team-csk', 'Chennai Super Kings', 'CSK', 'Chennai', '#FDB913', '#1C1C1C', '/teams/csk.png', 2008, 'venue-chennai', NOW(), NOW()),
  ('team-mi', 'Mumbai Indians', 'MI', 'Mumbai', '#004BA0', '#D4AF37', '/teams/mi.png', 2008, 'venue-mumbai', NOW(), NOW()),
  ('team-rcb', 'Royal Challengers Bengaluru', 'RCB', 'Bengaluru', '#EC1C24', '#000000', '/teams/rcb.png', 2008, 'venue-bengaluru', NOW(), NOW()),
  ('team-kkr', 'Kolkata Knight Riders', 'KKR', 'Kolkata', '#3A225D', '#FFD700', '/teams/kkr.png', 2008, 'venue-kolkata', NOW(), NOW()),
  ('team-dc', 'Delhi Capitals', 'DC', 'Delhi', '#0078BC', '#EF1C25', '/teams/dc.png', 2008, 'venue-delhi', NOW(), NOW()),
  ('team-srh', 'Sunrisers Hyderabad', 'SRH', 'Hyderabad', '#FF822A', '#000000', '/teams/srh.png', 2013, 'venue-hyderabad', NOW(), NOW()),
  ('team-pbks', 'Punjab Kings', 'PBKS', 'Mohali', '#ED1B24', '#A7A9AC', '/teams/pbks.png', 2008, NULL, NOW(), NOW()),
  ('team-rr', 'Rajasthan Royals', 'RR', 'Jaipur', '#EA1A85', '#254AA5', '/teams/rr.png', 2008, 'venue-jaipur', NOW(), NOW()),
  ('team-gt', 'Gujarat Titans', 'GT', 'Ahmedabad', '#1C1C1C', '#B09862', '/teams/gt.png', 2022, 'venue-ahmedabad', NOW(), NOW()),
  ('team-lsg', 'Lucknow Super Giants', 'LSG', 'Lucknow', '#ACE5EE', '#A72056', '/teams/lsg.png', 2022, NULL, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create IPL 2026 Matches (First 10 matches of the season)
INSERT INTO ipl_matches (id, match_number, home_team_id, away_team_id, venue_id, match_date, match_time, status, price_multiplier, is_playoff, created_at, updated_at)
VALUES
  ('match-1', 1, 'team-kkr', 'team-csk', 'venue-kolkata', '2026-03-21', '7:30 PM IST', 'UPCOMING', 1.5, false, NOW(), NOW()),
  ('match-2', 2, 'team-mi', 'team-rcb', 'venue-mumbai', '2026-03-22', '7:30 PM IST', 'UPCOMING', 1.5, false, NOW(), NOW()),
  ('match-3', 3, 'team-dc', 'team-srh', 'venue-delhi', '2026-03-23', '7:30 PM IST', 'UPCOMING', 1.0, false, NOW(), NOW()),
  ('match-4', 4, 'team-gt', 'team-pbks', 'venue-ahmedabad', '2026-03-24', '7:30 PM IST', 'UPCOMING', 1.0, false, NOW(), NOW()),
  ('match-5', 5, 'team-rr', 'team-lsg', 'venue-jaipur', '2026-03-25', '7:30 PM IST', 'UPCOMING', 1.0, false, NOW(), NOW()),
  ('match-6', 6, 'team-csk', 'team-mi', 'venue-chennai', '2026-03-26', '7:30 PM IST', 'UPCOMING', 2.0, false, NOW(), NOW()),
  ('match-7', 7, 'team-rcb', 'team-kkr', 'venue-bengaluru', '2026-03-27', '7:30 PM IST', 'UPCOMING', 1.5, false, NOW(), NOW()),
  ('match-8', 8, 'team-srh', 'team-gt', 'venue-hyderabad', '2026-03-28', '7:30 PM IST', 'UPCOMING', 1.0, false, NOW(), NOW()),
  ('match-9', 9, 'team-pbks', 'team-dc', 'venue-jaipur', '2026-03-29', '3:30 PM IST', 'UPCOMING', 1.0, false, NOW(), NOW()),
  ('match-10', 10, 'team-lsg', 'team-rr', 'venue-delhi', '2026-03-29', '7:30 PM IST', 'UPCOMING', 1.0, false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verify data
SELECT 'IPL Venues:', COUNT(*) FROM ipl_venues;
SELECT 'IPL Teams:', COUNT(*) FROM ipl_teams;
SELECT 'IPL Matches:', COUNT(*) FROM ipl_matches;
