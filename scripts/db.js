/* Persistent JSON database for QuestQuiz production accounts.
   DATA_DIR should be a Railway Volume mount (e.g. /data) so redeploys keep users. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'questquiz-db.json');

function emptyDb() {
  return {
    version: 1,
    settings: {
      passMark: 80,
      assessmentsToClear: 5,
      xpPerCorrect: 10,
      xpPerRecovery: 4,
      behavioralAdvertising: false,
      thirdPartyAnalytics: false,
      dataRetentionMonths: 18,
      requirePinEveryExam: true,
      printPrices: { sticker: 4.5, mug: 14, bottle: 22 },
      consentVersion: '2026-09-A',
      apExamWindowOpens: '2027-05-03'
    },
    users: {},
    learners: {},
    schools: {},
    rewards: defaultRewards(),
    grants: [],
    orders: [],
    pendingSchools: [],
    linkRequests: [],
    sessions: {},
    emailCodes: {},
    audit: []
  };
}

function defaultRewards() {
  const id = () => 'r_' + crypto.randomBytes(4).toString('hex');
  return [
    { id: id(), tier: 'platform', title: 'Badge Sticker Sheet — free print credit', desc: 'One free printed sticker sheet of any badge you have earned.', kind: 'credit', band: 'any', level: 1, stock: 500, sponsor: 'QuestQuiz', active: true },
    { id: id(), tier: 'platform', title: 'Wallpaper Pack: Aurora Set', desc: 'Five wallpapers for phone and laptop.', kind: 'download', band: 'any', level: 3, stock: 9999, sponsor: 'QuestQuiz', active: true },
    { id: id(), tier: 'platform', title: 'Double XP Weekend', desc: 'Every correct answer is worth double XP for 48 hours.', kind: 'perk', band: 'any', level: 5, stock: 9999, sponsor: 'QuestQuiz', active: true },
    { id: id(), tier: 'platform', title: 'AP Practice Unlimited — 30 days', desc: 'Unlimited AP practice sets and full mock exams for a month.', kind: 'perk', band: 'h912', level: 2, stock: 9999, sponsor: 'QuestQuiz', active: true },
    { id: id(), tier: 'partner', title: 'Scholastic — 20% off one book', desc: 'Single-use code, valid online, no personal data shared beyond a first name.', kind: 'code', band: 'any', level: 2, stock: 240, sponsor: 'Scholastic', active: true }
  ];
}

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read() {
  ensureDir();
  if (!fs.existsSync(DB_PATH)) {
    const db = emptyDb();
    write(db);
    return db;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(raw);
    if (!db.users) Object.assign(db, emptyDb(), db);
    return db;
  } catch (e) {
    console.error('DB read failed, starting empty:', e.message);
    return emptyDb();
  }
}

function write(db) {
  ensureDir();
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 0));
  fs.renameSync(tmp, DB_PATH);
}

let cache = null;
function get() {
  if (!cache) cache = read();
  return cache;
}
function save(db) {
  cache = db;
  write(db);
}
function mutate(fn) {
  const db = get();
  const result = fn(db);
  save(db);
  return result;
}

module.exports = { get, save, mutate, DATA_DIR, DB_PATH, emptyDb };
