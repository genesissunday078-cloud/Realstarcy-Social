-- Realstarcy seed data
-- Truncate all tables cleanly
TRUNCATE TABLE notifications, comments, loves, follows, posts, users RESTART IDENTITY CASCADE;

-- ── USERS ─────────────────────────────────────────────────────────────────
INSERT INTO users (username, display_name, avatar, bio, post_count, love_count) VALUES
-- ID 1: maya_real (current user / app protagonist)
('maya_real',       'Maya ✦',             'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face', 'living unfiltered. no edits, no filters, just me. ✦', 3, 10000000),
-- IDs 2-5: regular users / friends
('zara_vibes',      'Zara 🌙',            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face', 'chasing sunsets and good energy', 1, 420000),
('kai_moments',     'Kai',                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face', 'photographer | traveler | coffee addict', 1, 310000),
('nova_lens',       'Nova 📷',            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face', 'seeing the world one frame at a time', 0, 280000),
('reef_wild',       'Reef',               'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face', 'ocean lover | free diver | storyteller', 0, 190000),
-- IDs 6-25: celebrities
('selena_star',     'Selena ⭐',          'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&crop=face', 'Grammy winner. Soul on fire. 🔥', 1, 8500000),
('drizzy_flow',     'Drizzy 🦉',         'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', '6ix forever. OVO.', 1, 9200000),
('beyonce_hive',    'Queen B 👑',         'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face', 'Renaissance. Formation. Legacy.', 1, 15000000),
('kendrick_real',   'Kendrick',           'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=200&h=200&fit=crop&crop=face', 'Compton. Poetry. Truth.', 1, 7800000),
('rihanna_fenty',   'RiRi 💄',           'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face', 'Fenty Beauty. Savage X. Barbados girl.', 1, 13500000),
('travis_astro',    'Travis 🌵',         'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face', 'Cactus Jack. Astroworld forever.', 1, 6900000),
('ariana_cloud',    'Ariana ☁️',         'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=face', 'thank u, next. ♡', 1, 11200000),
('billie_dark',     'Billie 🖤',         'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200&h=200&fit=crop&crop=face', 'bad guy. duh.', 1, 9800000),
('weekend_xo',      'The Weeknd 🌙',      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face', 'After Hours. XO XOXO.', 1, 10500000),
('taylor_era',      'Taylor ✨',          'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200&h=200&fit=crop&crop=face', 'Eras Tour. All too well.', 1, 14700000),
('post_malone_',    'Post 🌹',           'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=face', 'rockstar. sunflower. stay with me.', 1, 5400000),
('cardi_bardi',     'Cardi B 💅',        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face', 'Okurrr. WAP era forever.', 1, 8100000),
('bad_bunny_pr',    'Bad Bunny 🐰',      'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&h=200&fit=crop&crop=face', 'Un Verano Sin Ti. Puerto Rico 🇵🇷', 1, 12000000),
('lizzo_juice',     'Lizzo 🍋',          'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop&crop=face', '100% that b*tch. Self-love evangelist.', 1, 4600000),
('dua_lipa_pop',    'Dua Lipa 💙',       'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face', 'Future Nostalgia. Radical Optimism.', 1, 9100000),
('sabrina_singer',  'Sabrina ☀️',        'https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop&crop=face', 'Short n Sweet. please please please.', 1, 7300000),
('olivia_sour',     'Olivia 🩸',         'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=200&h=200&fit=crop&crop=face', 'SOUR. GUTS. good 4 u.', 1, 8600000),
('frank_ocean_',    'Frank Ocean 🌊',    'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&h=200&fit=crop&crop=face', 'Blonde. Nights. Channel Orange.', 1, 6200000),
('sza_ctrl',        'SZA 🌸',            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face', 'CTRL. SOS. Snooze.', 1, 7000000);

-- ── POSTS ─────────────────────────────────────────────────────────────────
INSERT INTO posts (user_id, content, image_url, video_url, love_count, comment_count, tags) VALUES
-- Maya's posts (user_id=1)
(1, 'no filter. no edits. just me on a tuesday morning and honestly? feeling it. ✦',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop',
  NULL, 284000, 1240, ARRAY['authentic','unfiltered','realstarcy']),
(1, 'took this with my phone at 6am. the light was too good not to share. good morning 🌅',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  NULL, 193000, 872, ARRAY['morning','sunrise','realmoment']),
(1, 'finally finished the studio session at 3am. tired but the music is everything right now 🎵',
  NULL, NULL, 510000, 3100, ARRAY['music','studio','process']),
-- selena_star (6)
(6, 'rare selena check-in. been off socials for a week and my soul feels restored 🌿',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=1000&fit=crop',
  NULL, 4200000, 28000, ARRAY['mentalhealth','balance']),
-- drizzy_flow (7)
(7, '6 god 🙏 new music coming. y''all not ready.',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
  NULL, 6800000, 42000, ARRAY['ovo','newmusic']),
-- beyonce_hive (8)
(8, 'Renaissance world tour was everything. Thank you to every single person who came out. We did that. 👑',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
  NULL, 12000000, 89000, ARRAY['renaissance','beyhive']),
-- kendrick_real (9)
(9, 'Compton forever. Art is the weapon.',
  NULL, NULL, 5600000, 31000, ARRAY['poetry','compton']),
-- rihanna_fenty (10)
(10, 'new fenty drop midnight 🖤 y''all been asking. here it comes.',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=1000&fit=crop',
  NULL, 9800000, 67000, ARRAY['fenty','beauty']),
-- travis_astro (11)
(11, 'studio life 🌵 rage.',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop',
  NULL, 4900000, 22000, ARRAY['cactus','rage']),
-- ariana_cloud (12)
(12, 'filmed the new video this week and I cried three times. it''s giving everything. ☁️',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&h=1000&fit=crop',
  NULL, 8100000, 54000, ARRAY['newmusic','behindthescenes']),
-- billie_dark (13)
(13, 'don''t smile if you don''t mean it.',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=800&h=1000&fit=crop',
  NULL, 7200000, 41000, ARRAY['billie','real']),
-- weekend_xo (14)
(14, 'After Hours still hits different at 3am. that album saved me.',
  NULL, NULL, 6400000, 38000, ARRAY['afterhours','xo']),
-- taylor_era (15)
(15, 'The Eras Tour film is coming. Every single era, every memory. I love you so much it''s not normal. ✨',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
  NULL, 11500000, 95000, ARRAY['erastour','swifties']),
-- post_malone_ (16)
(16, 'just planted sunflowers in my backyard. vibing. 🌻',
  'https://images.unsplash.com/photo-1490750967868-88df5691cc9a?w=800&h=600&fit=crop',
  NULL, 3800000, 19000, ARRAY['life','sunflower']),
-- cardi_bardi (17)
(17, 'I''m a boss you a worker b*tch. okurrr 💅',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=1000&fit=crop',
  NULL, 5900000, 33000, ARRAY['cardi','boss']),
-- bad_bunny_pr (18)
(18, 'Puerto Rico en mi corazón siempre 🇵🇷 Un verano sin ti fue eterno. Gracias.',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop',
  NULL, 9300000, 71000, ARRAY['puertorico','badbunny']),
-- lizzo_juice (19)
(19, 'reminder that you are enough. you are a goddess. now go drink your water. 🍋',
  'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&h=1000&fit=crop',
  NULL, 3200000, 18000, ARRAY['selflove','lizzo']),
-- dua_lipa_pop (20)
(20, 'future nostalgia but make it 2024. new era incoming 💙',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1000&fit=crop',
  NULL, 6700000, 44000, ARRAY['dualipa','newera']),
-- sabrina_singer (21)
(21, 'please please please listen to the new album all the way through 🙏 track 7 will break you.',
  NULL, NULL, 5100000, 37000, ARRAY['shortansweet','sabrina']),
-- olivia_sour (22)
(22, 'GUTS world tour is officially a wrap. I''m still crying. You are the reason I make music. 🩸',
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
  NULL, 6200000, 48000, ARRAY['guts','oliviarodrigo']),
-- frank_ocean_ (23)
(23, 'thinking about channel orange again.',
  NULL, NULL, 4800000, 26000, ARRAY['blond','music']),
-- sza_ctrl (24)
(24, 'SOS era was real. now what. 🌸',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=1000&fit=crop',
  NULL, 5300000, 29000, ARRAY['sza','sos']),
-- maya extra post
(1, 'been thinking about how social media made us perform instead of live. this app feels different. ✦',
  NULL, NULL, 820000, 5600, ARRAY['thoughts','authentic','realstarcy']),
-- zara_vibes (2)
(2, 'golden hour energy 🌙 nothing else needed',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=600&fit=crop',
  NULL, 87000, 430, ARRAY['goldenhour','vibes']),
-- kai_moments (3)
(3, 'captured this between takes. real life doesn''t wait for you to be ready 📷',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
  NULL, 64000, 280, ARRAY['photography','candid']);

-- ── FOLLOWS ───────────────────────────────────────────────────────────────
-- All celebrities (6-25) follow maya (1)
INSERT INTO follows (follower_id, following_id) VALUES
(6,1),(7,1),(8,1),(9,1),(10,1),(11,1),(12,1),(13,1),(14,1),(15,1),
(16,1),(17,1),(18,1),(19,1),(20,1),(21,1),(22,1),(23,1),(24,1),(25,1),
-- Maya follows first 10 celebrities
(1,6),(1,7),(1,8),(1,9),(1,10),(1,11),(1,12),(1,13),(1,14),(1,15),
-- Some regular users follow maya
(2,1),(3,1),(4,1),(5,1),
-- Cross-celeb follows
(6,8),(8,6),(7,9),(15,12),(20,22),(6,15),(9,7);

-- ── LOVES — celebrities loved maya's posts ────────────────────────────────
INSERT INTO loves (user_id, post_id) VALUES
(6,1),(7,1),(8,1),(9,1),(10,1),(11,1),
(6,2),(7,2),(8,2),(9,2),
(6,3),(7,3),(8,3),(9,3),(10,3),(11,3),(12,3),(13,3);

-- ── COMMENTS ──────────────────────────────────────────────────────────────
INSERT INTO comments (post_id, user_id, content) VALUES
(1, 6,  'this is everything 🔥'),
(1, 8,  'queen behaviour fr fr'),
(1, 2,  'obsessed with this 💙'),
(1, 15, 'okay but MAYA 😭❤️'),
(1, 10, 'the AUDACITY to look this good unfiltered 🔥'),
(2, 7,  'the vibe is immaculate'),
(2, 12, 'good morning to you specifically 🌅'),
(2, 3,  'the light is doing everything'),
(3, 9,  'can''t wait to hear this'),
(3, 13, '3am hits different in the studio'),
(3, 11, 'the process is the art 🙏');

SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Posts: ' || COUNT(*) FROM posts;
SELECT 'Follows: ' || COUNT(*) FROM follows;
SELECT 'Loves: ' || COUNT(*) FROM loves;
SELECT 'Comments: ' || COUNT(*) FROM comments;
