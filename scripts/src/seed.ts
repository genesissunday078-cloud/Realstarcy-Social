import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { usersTable, followsTable, postsTable, lovesTable, commentsTable } from "../../lib/db/src/schema/index.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const db = drizzle(client);

console.log("🌱 Seeding database...");

// ── USERS ──────────────────────────────────────────────────────────────────
// Insert maya_real first so she gets ID 1
const celebrities = [
  // ID 1 — the app's current user
  {
    username: "maya_real",
    displayName: "Maya ✦",
    avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face",
    bio: "living unfiltered. no edits, no filters, just me. ✦",
    loveCount: 10000000,
  },
  // Filler accounts (IDs 2-5) so celebrities land at 6-25 matching memory
  {
    username: "zara_vibes",
    displayName: "Zara 🌙",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
    bio: "chasing sunsets and good energy",
    loveCount: 420000,
  },
  {
    username: "kai_moments",
    displayName: "Kai",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    bio: "photographer | traveler | coffee addict",
    loveCount: 310000,
  },
  {
    username: "nova_lens",
    displayName: "Nova 📷",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face",
    bio: "seeing the world one frame at a time",
    loveCount: 280000,
  },
  {
    username: "reef_wild",
    displayName: "Reef",
    avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face",
    bio: "ocean lover | free diver | storyteller",
    loveCount: 190000,
  },
  // Celebrity accounts (IDs 6-25)
  {
    username: "selena_star",
    displayName: "Selena ⭐",
    avatar: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&crop=face",
    bio: "Grammy winner. Soul on fire. 🔥",
    loveCount: 8500000,
  },
  {
    username: "drizzy_flow",
    displayName: "Drizzy 🦉",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    bio: "6ix forever. OVO.",
    loveCount: 9200000,
  },
  {
    username: "beyonce_hive",
    displayName: "Queen B 👑",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    bio: "Renaissance. Formation. Legacy.",
    loveCount: 15000000,
  },
  {
    username: "kendrick_real",
    displayName: "Kendrick",
    avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=200&h=200&fit=crop&crop=face",
    bio: "Compton. Poetry. Truth.",
    loveCount: 7800000,
  },
  {
    username: "rihanna_fenty",
    displayName: "RiRi 💄",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face",
    bio: "Fenty Beauty. Savage X. Barbados girl.",
    loveCount: 13500000,
  },
  {
    username: "travis_astro",
    displayName: "Travis 🌵",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face",
    bio: "Cactus Jack. Astroworld forever.",
    loveCount: 6900000,
  },
  {
    username: "ariana_cloud",
    displayName: "Ariana ☁️",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop&crop=face",
    bio: "thank u, next. ♡",
    loveCount: 11200000,
  },
  {
    username: "billie_dark",
    displayName: "Billie 🖤",
    avatar: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=200&h=200&fit=crop&crop=face",
    bio: "bad guy. duh.",
    loveCount: 9800000,
  },
  {
    username: "weekend_xo",
    displayName: "The Weeknd 🌙",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    bio: "After Hours. XO XOXO.",
    loveCount: 10500000,
  },
  {
    username: "taylor_era",
    displayName: "Taylor ✨",
    avatar: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200&h=200&fit=crop&crop=face",
    bio: "Eras Tour. All too well.",
    loveCount: 14700000,
  },
  {
    username: "post_malone_",
    displayName: "Post 🌹",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=face",
    bio: "rockstar. sunflower. stay with me.",
    loveCount: 5400000,
  },
  {
    username: "cardi_bardi",
    displayName: "Cardi B 💅",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=face",
    bio: "Okurrr. WAP era forever.",
    loveCount: 8100000,
  },
  {
    username: "bad_bunny_pr",
    displayName: "Bad Bunny 🐰",
    avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&h=200&fit=crop&crop=face",
    bio: "Un Verano Sin Ti. Puerto Rico 🇵🇷",
    loveCount: 12000000,
  },
  {
    username: "lizzo_juice",
    displayName: "Lizzo 🍋",
    avatar: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop&crop=face",
    bio: "100% that b*tch. Self-love evangelist.",
    loveCount: 4600000,
  },
  {
    username: "dua_lipa_pop",
    displayName: "Dua Lipa 💙",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
    bio: "Future Nostalgia. Radical Optimism.",
    loveCount: 9100000,
  },
  {
    username: "sabrina_singer",
    displayName: "Sabrina ☀️",
    avatar: "https://images.unsplash.com/photo-1519741497674-611481863552?w=200&h=200&fit=crop&crop=face",
    bio: "Short n' Sweet. please please please.",
    loveCount: 7300000,
  },
  {
    username: "olivia_sour",
    displayName: "Olivia 🩸",
    avatar: "https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=200&h=200&fit=crop&crop=face",
    bio: "SOUR. GUTS. good 4 u.",
    loveCount: 8600000,
  },
  {
    username: "frank_ocean_",
    displayName: "Frank Ocean 🌊",
    avatar: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&h=200&fit=crop&crop=face",
    bio: "Blonde. Nights. Channel Orange.",
    loveCount: 6200000,
  },
  {
    username: "sza_ctrl",
    displayName: "SZA 🌸",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    bio: "CTRL. SOS. Snooze.",
    loveCount: 7000000,
  },
];

console.log("Inserting users...");
const insertedUsers = await db.insert(usersTable).values(celebrities).returning();
console.log(`  ✓ ${insertedUsers.length} users created`);

const mayaId = insertedUsers[0].id;
const celebIds = insertedUsers.slice(5).map(u => u.id);

// ── POSTS ──────────────────────────────────────────────────────────────────
const postSeeds = [
  // Maya's posts
  {
    userId: mayaId,
    content: "no filter. no edits. just me on a tuesday morning and honestly? feeling it. ✦",
    imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1000&fit=crop",
    tags: ["authentic", "unfiltered", "realstarcy"],
    loveCount: 284000,
    commentCount: 1240,
  },
  {
    userId: mayaId,
    content: "took this with my phone at 6am. the light was too good not to share. good morning 🌅",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    tags: ["morning", "sunrise", "realmoment"],
    loveCount: 193000,
    commentCount: 872,
  },
  {
    userId: mayaId,
    content: "finally finished the studio session at 3am. tired but the music is everything right now 🎵",
    tags: ["music", "studio", "process"],
    loveCount: 510000,
    commentCount: 3100,
  },
  // Celebrity posts
  {
    userId: celebIds[0], // selena_star
    content: "rare selena check-in. been off socials for a week and my soul feels restored 🌿",
    imageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&h=1000&fit=crop",
    tags: ["mentalhealth", "balance"],
    loveCount: 4200000,
    commentCount: 28000,
  },
  {
    userId: celebIds[1], // drizzy_flow
    content: "6 god 🙏 new music coming. y'all not ready.",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
    tags: ["ovo", "newmusic"],
    loveCount: 6800000,
    commentCount: 42000,
  },
  {
    userId: celebIds[2], // beyonce_hive
    content: "Renaissance world tour was everything. Thank you to every single person who came out. We did that. 👑",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop",
    tags: ["renaissance", "beyhive"],
    loveCount: 12000000,
    commentCount: 89000,
  },
  {
    userId: celebIds[3], // kendrick_real
    content: "Compton forever. Art is the weapon.",
    tags: ["poetry", "compton"],
    loveCount: 5600000,
    commentCount: 31000,
  },
  {
    userId: celebIds[4], // rihanna_fenty
    content: "new fenty drop midnight 🖤 y'all been asking. here it comes.",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=1000&fit=crop",
    tags: ["fenty", "beauty"],
    loveCount: 9800000,
    commentCount: 67000,
  },
  {
    userId: celebIds[5], // travis_astro
    content: "studio life 🌵 rage.",
    imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop",
    tags: ["cactus", "rage"],
    loveCount: 4900000,
    commentCount: 22000,
  },
  {
    userId: celebIds[6], // ariana_cloud
    content: "filmed the new video this week and I cried three times. it's giving everything. ☁️",
    imageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&h=1000&fit=crop",
    tags: ["newmusic", "behindthescenes"],
    loveCount: 8100000,
    commentCount: 54000,
  },
  {
    userId: celebIds[7], // billie_dark
    content: "don't smile if you don't mean it.",
    imageUrl: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=800&h=1000&fit=crop",
    tags: ["billie", "real"],
    loveCount: 7200000,
    commentCount: 41000,
  },
  {
    userId: celebIds[8], // weekend_xo
    content: "After Hours still hits different at 3am. that album saved me.",
    tags: ["afterhours", "xo"],
    loveCount: 6400000,
    commentCount: 38000,
  },
  {
    userId: celebIds[9], // taylor_era
    content: "The Eras Tour film is coming. Every single era, every memory. I love you so much it's not normal. ✨",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
    tags: ["erastour", "swifties"],
    loveCount: 11500000,
    commentCount: 95000,
  },
  {
    userId: celebIds[10], // post_malone_
    content: "just planted sunflowers in my backyard. vibing. 🌻",
    imageUrl: "https://images.unsplash.com/photo-1490750967868-88df5691cc9a?w=800&h=600&fit=crop",
    tags: ["life", "sunflower"],
    loveCount: 3800000,
    commentCount: 19000,
  },
  {
    userId: celebIds[11], // cardi_bardi
    content: "I'm a boss you a worker b*tch. okurrr 💅",
    imageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=1000&fit=crop",
    tags: ["cardi", "boss"],
    loveCount: 5900000,
    commentCount: 33000,
  },
  {
    userId: celebIds[12], // bad_bunny_pr
    content: "Puerto Rico en mi corazón siempre 🇵🇷 Un verano sin ti fue eterno. Gracias.",
    imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop",
    tags: ["puertorico", "badbunny"],
    loveCount: 9300000,
    commentCount: 71000,
  },
  {
    userId: celebIds[13], // lizzo_juice
    content: "reminder that you are enough. you are a goddess. now go drink your water. 🍋",
    imageUrl: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=800&h=1000&fit=crop",
    tags: ["selflove", "lizzo"],
    loveCount: 3200000,
    commentCount: 18000,
  },
  {
    userId: celebIds[14], // dua_lipa_pop
    content: "future nostalgia but make it 2024. new era incoming 💙",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1000&fit=crop",
    tags: ["dualipa", "newera"],
    loveCount: 6700000,
    commentCount: 44000,
  },
  {
    userId: celebIds[15], // sabrina_singer
    content: "please please please listen to the new album all the way through 🙏 track 7 will break you.",
    tags: ["shortansweet", "sabrina"],
    loveCount: 5100000,
    commentCount: 37000,
  },
  {
    userId: celebIds[16], // olivia_sour
    content: "GUTS world tour is officially a wrap. I'm still crying. You are the reason I make music. 🩸",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
    tags: ["guts", "oliviarodrigo"],
    loveCount: 6200000,
    commentCount: 48000,
  },
  {
    userId: celebIds[17], // frank_ocean_
    content: "thinking about channel orange again.",
    tags: ["blond", "music"],
    loveCount: 4800000,
    commentCount: 26000,
  },
  {
    userId: celebIds[18], // sza_ctrl
    content: "SOS era was real. now what. 🌸",
    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=1000&fit=crop",
    tags: ["sza", "sos"],
    loveCount: 5300000,
    commentCount: 29000,
  },
  // Extra posts from maya and a few others
  {
    userId: mayaId,
    content: "been thinking about how social media made us perform instead of live. this app feels different. ✦",
    tags: ["thoughts", "authentic", "realstarcy"],
    loveCount: 820000,
    commentCount: 5600,
  },
  {
    userId: insertedUsers[1].id, // zara_vibes
    content: "golden hour energy 🌙 nothing else needed",
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=600&fit=crop",
    tags: ["goldenhour", "vibes"],
    loveCount: 87000,
    commentCount: 430,
  },
  {
    userId: insertedUsers[2].id, // kai_moments
    content: "captured this between takes. real life doesn't wait for you to be ready 📷",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    tags: ["photography", "candid"],
    loveCount: 64000,
    commentCount: 280,
  },
];

console.log("Inserting posts...");
const insertedPosts = await db.insert(postsTable).values(postSeeds).returning();
console.log(`  ✓ ${insertedPosts.length} posts created`);

// Update user post counts
for (const user of insertedUsers) {
  const count = insertedPosts.filter(p => p.userId === user.id).length;
  if (count > 0) {
    await db.update(usersTable).set({ postCount: count }).where(
      (await import("drizzle-orm")).eq(usersTable.id, user.id)
    );
  }
}

// ── FOLLOWS — celebs follow maya, maya follows some celebs ────────────────
console.log("Inserting follows...");
const followSeeds = [
  // All celebs follow maya
  ...celebIds.map(cId => ({ followerId: cId, followingId: mayaId })),
  // Maya follows first 10 celebs
  ...celebIds.slice(0, 10).map(cId => ({ followerId: mayaId, followingId: cId })),
  // Some cross-follows between celebs
  { followerId: celebIds[0], followingId: celebIds[2] },
  { followerId: celebIds[2], followingId: celebIds[0] },
  { followerId: celebIds[1], followingId: celebIds[3] },
  { followerId: celebIds[9], followingId: celebIds[6] },
  { followerId: celebIds[14], followingId: celebIds[16] },
];
await db.insert(followsTable).values(followSeeds);
console.log(`  ✓ ${followSeeds.length} follows created`);

// ── LOVES — some celebs loved maya's posts ────────────────────────────────
console.log("Inserting loves...");
const mayaPosts = insertedPosts.filter(p => p.userId === mayaId);
const loveSeeds = celebIds.slice(0, 8).flatMap(cId =>
  mayaPosts.map(p => ({ userId: cId, postId: p.id }))
);
if (loveSeeds.length > 0) {
  await db.insert(lovesTable).values(loveSeeds);
}
console.log(`  ✓ ${loveSeeds.length} loves created`);

// ── COMMENTS ──────────────────────────────────────────────────────────────
console.log("Inserting comments...");
const commentSeeds = mayaPosts.flatMap((p, i) => [
  { postId: p.id, userId: celebIds[i % celebIds.length], content: "this is everything 🔥" },
  { postId: p.id, userId: celebIds[(i + 1) % celebIds.length], content: "queen behaviour fr fr" },
  { postId: p.id, userId: insertedUsers[1].id, content: "obsessed with this 💙" },
]);
if (commentSeeds.length > 0) {
  await db.insert(commentsTable).values(commentSeeds);
}
console.log(`  ✓ ${commentSeeds.length} comments created`);

console.log("\n✅ Seed complete!");
console.log(`   Current user: ${insertedUsers[0].username} (ID ${insertedUsers[0].id})`);
console.log(`   Total users: ${insertedUsers.length}`);
console.log(`   Total posts: ${insertedPosts.length}`);

await client.end();
