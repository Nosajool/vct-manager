// Game Constants - Names, nationalities, and configuration data

import type { Region } from '../types';

/**
 * First names by region for player generation
 */
export const FIRST_NAMES: Record<Region, string[]> = {
  Americas: [
    'James', 'Michael', 'David', 'Daniel', 'Carlos', 'Juan', 'Luis', 'Pedro',
    'Diego', 'Alex', 'Ryan', 'Tyler', 'Brandon', 'Justin', 'Kevin', 'Eric',
    'Chris', 'Matt', 'Jake', 'Nick', 'Anthony', 'Marcus', 'Andre', 'Victor',
    'Gabriel', 'Lucas', 'Rafael', 'Bruno', 'Felipe', 'Thiago', 'Gustavo',
    'Eduardo', 'Ricardo', 'Fernando', 'Mateo', 'Sebastian', 'Alejandro',
    'Ethan', 'Noah', 'Liam', 'Mason', 'Logan', 'Aiden', 'Jayden', 'Caleb',
  ],
  EMEA: [
    'Emil', 'Nikita', 'Dmitri', 'Alexei', 'Ivan', 'Sergei', 'Viktor', 'Andrei',
    'Mohammed', 'Ahmed', 'Omar', 'Yusuf', 'Ali', 'Hassan', 'Mehdi', 'Karim',
    'Pierre', 'Jean', 'Louis', 'Antoine', 'Mathieu', 'Lucas', 'Hugo', 'Leo',
    'Max', 'Felix', 'Leon', 'Paul', 'Tim', 'Jan', 'Lukas', 'Jonas',
    'Oscar', 'Erik', 'Jesper', 'Rasmus', 'Martin', 'Henrik', 'Anders', 'Lars',
    'Marco', 'Luca', 'Alessandro', 'Francesco', 'Matteo', 'Lorenzo', 'Andrea',
  ],
  Pacific: [
    'Takeshi', 'Yuki', 'Kenji', 'Hiroshi', 'Daiki', 'Ryu', 'Shota', 'Kenta',
    'Min-jun', 'Ji-hoon', 'Sung', 'Hyun', 'Jin', 'Seung', 'Dong', 'Woo',
    'Wei', 'Jun', 'Ming', 'Chen', 'Hao', 'Xin', 'Lei', 'Yang',
    'Thanawat', 'Nattapong', 'Piyawat', 'Sarawut', 'Kritsada', 'Wuttipong',
    'Nguyen', 'Tran', 'Minh', 'Duc', 'Anh', 'Hung', 'Long', 'Phong',
    'Rizal', 'Arif', 'Fajar', 'Budi', 'Dimas', 'Eko', 'Gilang', 'Bayu',
  ],
  China: [
    'Wei', 'Hao', 'Ming', 'Jun', 'Cheng', 'Yang', 'Jian', 'Lei',
    'Feng', 'Chen', 'Xin', 'Yu', 'Tao', 'Hui', 'Peng', 'Bo',
    'Zheng', 'Lin', 'Kai', 'Rui', 'Zhi', 'Yong', 'Qiang', 'Gang',
    'Wen', 'Jie', 'Liang', 'Heng', 'Xiang', 'Long', 'Bin', 'Fei',
    'Hong', 'Guo', 'Sheng', 'Dong', 'Ping', 'An', 'Nan', 'Kang',
  ],
};

/**
 * Last names by region for player generation
 */
export const LAST_NAMES: Record<Region, string[]> = {
  Americas: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
    'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Ferreira',
    'Almeida', 'Ribeiro', 'Gomes', 'Martins', 'Carvalho', 'Rocha', 'Lima',
    'Fernandez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez',
  ],
  EMEA: [
    'Petrov', 'Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Sokolov', 'Lebedev',
    'Kozlov', 'Novikov', 'Morozov', 'Volkov', 'Alekseev', 'Fedorov', 'Mikhailov',
    'Dubois', 'Laurent', 'Bernard', 'Robert', 'Richard', 'Petit', 'Durand',
    'Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner',
    'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson',
    'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo',
    'Al-Hassan', 'El-Sayed', 'Yilmaz', 'Demir', 'Kaya', 'Celik', 'Sahin',
  ],
  Pacific: [
    'Tanaka', 'Suzuki', 'Yamamoto', 'Watanabe', 'Ito', 'Nakamura', 'Kobayashi',
    'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue',
    'Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon', 'Jang', 'Lim', 'Han',
    'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
    'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vo', 'Dang', 'Bui', 'Do', 'Ho',
    'Wijaya', 'Santoso', 'Kusuma', 'Pratama', 'Putra', 'Saputra', 'Hidayat',
  ],
  China: [
    'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Huang', 'Zhou', 'Wu',
    'Xu', 'Sun', 'Hu', 'Zhu', 'Gao', 'Lin', 'He', 'Guo', 'Ma', 'Luo',
    'Liang', 'Song', 'Zheng', 'Xie', 'Han', 'Tang', 'Feng', 'Yu', 'Dong', 'Xiao',
    'Cheng', 'Cao', 'Yuan', 'Deng', 'Xu', 'Fu', 'Shen', 'Zeng', 'Peng', 'Lu',
  ],
};

/**
 * Nationalities by region
 */
export const NATIONALITIES: Record<Region, string[]> = {
  Americas: [
    'United States', 'Canada', 'Brazil', 'Argentina', 'Chile', 'Mexico',
    'Colombia', 'Peru', 'Uruguay', 'Venezuela',
  ],
  EMEA: [
    'Russia', 'Turkey', 'France', 'Germany', 'United Kingdom', 'Spain',
    'Poland', 'Ukraine', 'Sweden', 'Denmark', 'Finland', 'Norway',
    'Italy', 'Netherlands', 'Belgium', 'Czech Republic', 'Portugal',
    'Morocco', 'Egypt', 'Saudi Arabia', 'Israel', 'Kazakhstan',
  ],
  Pacific: [
    'South Korea', 'Japan', 'Philippines', 'Indonesia', 'Thailand',
    'Vietnam', 'Singapore', 'Malaysia', 'Australia', 'India', 'Taiwan',
  ],
  China: ['China'],
};

/**
 * In-game names (IGNs) prefixes and suffixes for variety
 */
export const IGN_PREFIXES = [
  '', 'x', 'The', 'Sir', 'Mr', 'Dr', 'Pro', 'King', 'Lord', 'Dark',
  'Shadow', 'Ice', 'Fire', 'Storm', 'Night', 'Star', 'Nova', 'Neo',
];

export const IGN_SUFFIXES = [
  '', 'x', 'XX', '99', '1', 'Jr', 'God', 'King', 'Pro', 'Gg',
  'Ace', 'One', 'Prime', 'Elite', 'Best', 'Top', 'Main',
];

/**
 * Common gaming-style names
 */
export const GAMING_NAMES = [
  'Ace', 'Blade', 'Blaze', 'Bolt', 'Chaos', 'Cipher', 'Cobra', 'Crypt',
  'Dash', 'Drake', 'Echo', 'Faze', 'Flash', 'Frost', 'Ghost', 'Hawk',
  'Hex', 'Hunter', 'Hydra', 'Ice', 'Jinx', 'Karma', 'Kuro', 'Laser',
  'Luna', 'Lynx', 'Mist', 'Neon', 'Night', 'Nova', 'Onyx', 'Phoenix',
  'Pulse', 'Pyro', 'Raze', 'Reaper', 'Rex', 'Riot', 'Rush', 'Sage',
  'Shadow', 'Shiro', 'Skull', 'Sky', 'Smoke', 'Snake', 'Spark', 'Spect',
  'Spirit', 'Steel', 'Storm', 'Swift', 'Tac', 'Tank', 'Toxic', 'Trace',
  'Trick', 'Turbo', 'Venom', 'Viper', 'Volt', 'Wolf', 'Wrath', 'Zero',
  'Zest', 'Zoom', 'Alpha', 'Beta', 'Omega', 'Delta', 'Sigma', 'Theta',
];

/**
 * VCT Teams by region (based on real franchised teams)
 */
export const VCT_TEAMS: Record<Region, { name: string; orgValue: number; fanbase: number; expectation: string; pressure: number }[]> = {
  Americas: [
    { name: 'Sentinels', orgValue: 5000000, fanbase: 95, expectation: 'Win Champions', pressure: 5 },
    { name: 'Cloud9', orgValue: 4500000, fanbase: 90, expectation: 'Top 3 regional finish', pressure: 4 },
    { name: '100 Thieves', orgValue: 4000000, fanbase: 85, expectation: 'Reach playoffs minimum', pressure: 4 },
    { name: 'NRG', orgValue: 3500000, fanbase: 75, expectation: 'Compete for playoffs', pressure: 3 },
    { name: 'Evil Geniuses', orgValue: 3500000, fanbase: 70, expectation: 'Compete for playoffs', pressure: 3 },
    { name: 'LOUD', orgValue: 4000000, fanbase: 88, expectation: 'Dominant regional performance', pressure: 5 },
    { name: 'FURIA', orgValue: 3000000, fanbase: 72, expectation: 'Compete for playoffs', pressure: 3 },
    { name: 'MIBR', orgValue: 3200000, fanbase: 78, expectation: 'Make playoffs', pressure: 3 },
    { name: 'Leviatán', orgValue: 2800000, fanbase: 68, expectation: 'Build competitive roster', pressure: 2 },
    { name: 'KRÜ Esports', orgValue: 2500000, fanbase: 65, expectation: 'Develop regional talent', pressure: 2 },
    { name: 'G2 Esports', orgValue: 4000000, fanbase: 82, expectation: 'Top 4 finish expected', pressure: 4 },
    { name: 'ENVY', orgValue: 2800000, fanbase: 65, expectation: 'Establish team identity', pressure: 2 },
  ],
  EMEA: [
    { name: 'Fnatic', orgValue: 4500000, fanbase: 92, expectation: 'Win Champions', pressure: 5 },
    { name: 'Team Liquid', orgValue: 4200000, fanbase: 88, expectation: 'Top 3 regional finish', pressure: 4 },
    { name: 'GIANTX', orgValue: 3500000, fanbase: 75, expectation: 'Compete for playoffs', pressure: 3 },
    { name: 'Team Heretics', orgValue: 3200000, fanbase: 75, expectation: 'Make playoffs', pressure: 3 },
    { name: 'NAVI', orgValue: 3800000, fanbase: 82, expectation: 'Qualify for internationals', pressure: 3 },
    { name: 'Karmine Corp', orgValue: 3500000, fanbase: 85, expectation: 'Compete for playoffs', pressure: 3 },
    { name: 'FUT Esports', orgValue: 2800000, fanbase: 70, expectation: 'Build competitive roster', pressure: 2 },
    { name: 'Gentle Mates', orgValue: 2400000, fanbase: 60, expectation: 'Develop team chemistry', pressure: 1 },
    { name: 'PCIFIC Esports', orgValue: 2300000, fanbase: 55, expectation: 'Gain competitive experience', pressure: 1 },
    { name: 'BBL Esports', orgValue: 2600000, fanbase: 68, expectation: 'Build regional presence', pressure: 2 },
    { name: 'ULF Esports', orgValue: 2300000, fanbase: 55, expectation: 'Establish team identity', pressure: 1 },
    { name: 'Team Vitality', orgValue: 3800000, fanbase: 80, expectation: 'Qualify for internationals', pressure: 3 },
  ],
  Pacific: [
    { name: 'T1', orgValue: 4500000, fanbase: 92, expectation: 'Win Champions', pressure: 5 },
    { name: 'DRX', orgValue: 4000000, fanbase: 90, expectation: 'Reach playoffs minimum', pressure: 4 },
    { name: 'Paper Rex', orgValue: 3500000, fanbase: 88, expectation: 'Compete for playoffs', pressure: 3 },
    { name: 'Rex Regum Qeon', orgValue: 2400000, fanbase: 62, expectation: 'Develop regional talent', pressure: 2 },
    { name: 'Nongshim RedForce', orgValue: 2800000, fanbase: 65, expectation: 'Build competitive roster', pressure: 2 },
    { name: 'Team Secret', orgValue: 3000000, fanbase: 72, expectation: 'Compete for playoffs', pressure: 3 },
    { name: 'ZETA DIVISION', orgValue: 3200000, fanbase: 82, expectation: 'Make playoffs', pressure: 3 },
    { name: 'FULL SENSE', orgValue: 2600000, fanbase: 68, expectation: 'Build team chemistry', pressure: 2 },
    { name: 'VARREL', orgValue: 2300000, fanbase: 58, expectation: 'Gain competitive experience', pressure: 1 },
    { name: 'Global Esports', orgValue: 2500000, fanbase: 65, expectation: 'Develop young talent', pressure: 2 },
    { name: 'DetonatioN FocusMe', orgValue: 2800000, fanbase: 70, expectation: 'Build regional presence', pressure: 2 },
    { name: 'Gen.G', orgValue: 4200000, fanbase: 85, expectation: 'Top 3 regional finish', pressure: 4 },
  ],
  China: [
    { name: 'EDward Gaming', orgValue: 4500000, fanbase: 90, expectation: 'Win Champions', pressure: 5 },
    { name: 'Bilibili Gaming', orgValue: 4000000, fanbase: 85, expectation: 'Reach playoffs minimum', pressure: 4 },
    { name: 'Xi Lai Gaming', orgValue: 3200000, fanbase: 72, expectation: 'Make playoffs', pressure: 3 },
    { name: 'Dragon Ranger Gaming', orgValue: 2600000, fanbase: 65, expectation: 'Build competitive roster', pressure: 2 },
    { name: 'Trace Esports', orgValue: 2300000, fanbase: 58, expectation: 'Gain competitive experience', pressure: 1 },
    { name: 'Wolves Esports', orgValue: 2500000, fanbase: 62, expectation: 'Develop young talent', pressure: 2 },
    { name: 'FunPlus Phoenix', orgValue: 4200000, fanbase: 88, expectation: 'Top 3 regional finish', pressure: 4 },
    { name: 'TYLOO', orgValue: 3000000, fanbase: 72, expectation: 'Compete for playoffs', pressure: 3 },
    { name: 'All Gamers', orgValue: 2800000, fanbase: 68, expectation: 'Build regional presence', pressure: 2 },
    { name: 'Nova Esports', orgValue: 3200000, fanbase: 75, expectation: 'Make playoffs', pressure: 3 },
    { name: 'JD Gaming', orgValue: 3800000, fanbase: 82, expectation: 'Qualify for internationals', pressure: 3 },
    { name: 'Titan Esports Club', orgValue: 2400000, fanbase: 60, expectation: 'Develop team chemistry', pressure: 2 },
  ],
};

/**
 * Valorant maps
 */
export const MAPS = [
  'Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture',
  'Pearl', 'Lotus', 'Sunset', 'Abyss',
];

/**
 * Valorant agents by role
 */
export const AGENTS = {
  Duelist: ['Jett', 'Reyna', 'Phoenix', 'Raze', 'Yoru', 'Neon', 'Iso'],
  Initiator: ['Sova', 'Breach', 'Skye', 'KAY/O', 'Fade', 'Gekko'],
  Controller: ['Brimstone', 'Omen', 'Viper', 'Astra', 'Harbor', 'Clove'],
  Sentinel: ['Sage', 'Cypher', 'Killjoy', 'Chamber', 'Deadlock', 'Vyse'],
};

/**
 * All agents flat list
 */
export const ALL_AGENTS = Object.values(AGENTS).flat();

/**
 * Stat generation ranges
 */
export const STAT_RANGES = {
  // Base ranges for random generation
  min: 40,
  max: 95,

  // Potential affects growth ceiling
  potentialMin: 60,
  potentialMax: 99,

  // Age affects stats
  peakAgeMin: 20,
  peakAgeMax: 25,
  youngAgeMin: 18,
  oldAgeMax: 30,

  // Form and morale
  defaultForm: 70,
  defaultMorale: 30,
};

/**
 * Contract/salary ranges (annual, in USD)
 */
export const SALARY_RANGES = {
  rookie: { min: 50000, max: 100000 },
  average: { min: 100000, max: 250000 },
  good: { min: 250000, max: 500000 },
  star: { min: 500000, max: 1000000 },
  superstar: { min: 1000000, max: 2500000 },
};

/**
 * Number of players per team
 */
export const ROSTER_SIZE = {
  active: 5,
  reserve: 2,
  maxTotal: 10,
};

/**
 * Number of teams per region
 */
export const TEAMS_PER_REGION = 12;

/**
 * VCT Americas Kickoff 2026 Seeding
 * Based on actual VCT 2026 format:
 * - Pool 1 (seeds 1-4): Champions 2025 qualifiers, receive bye to UB R2
 * - Pool 2 (seeds 5-12): Play in UB R1
 *
 * UB R1 matchups: 5v6, 7v8, 9v10, 11v12
 * UB R2 matchups: 1 vs winner(5v6), 2 vs winner(7v8), 3 vs winner(9v10), 4 vs winner(11v12)
 */
export const AMERICAS_KICKOFF_SEEDING: string[] = [
  'NRG',           // Seed 1 - Champions 2025 qualifier (bye)
  'MIBR',          // Seed 2 - Champions 2025 qualifier (bye)
  'Sentinels',     // Seed 3 - Champions 2025 qualifier (bye)
  'G2 Esports',    // Seed 4 - Champions 2025 qualifier (bye)
  'LOUD',          // Seed 5 - Pool 2 (plays seed 6)
  'Cloud9',        // Seed 6 - Pool 2 (plays seed 5)
  'ENVY',          // Seed 7 - Pool 2 (plays seed 8)
  'Evil Geniuses', // Seed 8 - Pool 2 (plays seed 7)
  'KRÜ Esports',   // Seed 9 - Pool 2 (plays seed 10)
  'FURIA',         // Seed 10 - Pool 2 (plays seed 9)
  '100 Thieves',   // Seed 11 - Pool 2 (plays seed 12)
  'Leviatán',      // Seed 12 - Pool 2 (plays seed 11)
];

/**
 * VCT EMEA Kickoff 2026 Seeding
 * Based on actual VCT 2026 format:
 * - Pool 1 (seeds 1-4): Champions 2025 qualifiers (Fnatic, Liquid, GIANTX, Heretics), receive bye to UB R2
 * - Pool 2 (seeds 5-12): Play in UB R1
 *
 * UB R1 matchups: 5v6 (NAVI vs KC), 7v8 (FUT vs Gentle Mates), 9v10 (PCIFIC vs BBL), 11v12 (ULF vs Vitality)
 * UB R2 matchups: 1 vs winner(5v6), 2 vs winner(7v8), 3 vs winner(9v10), 4 vs winner(11v12)
 */
export const EMEA_KICKOFF_SEEDING: string[] = [
  'Fnatic',        // Seed 1 - Champions 2025 qualifier (bye)
  'Team Liquid',   // Seed 2 - Champions 2025 qualifier (bye)
  'GIANTX',        // Seed 3 - Champions 2025 qualifier (bye)
  'Team Heretics', // Seed 4 - Champions 2025 qualifier (bye)
  'NAVI',          // Seed 5 - Pool 2 (plays seed 6)
  'Karmine Corp',  // Seed 6 - Pool 2 (plays seed 5)
  'FUT Esports',   // Seed 7 - Pool 2 (plays seed 8)
  'Gentle Mates',  // Seed 8 - Pool 2 (plays seed 7)
  'PCIFIC Esports', // Seed 9 - Pool 2 (plays seed 10) - Ascension 2025
  'BBL Esports',   // Seed 10 - Pool 2 (plays seed 9)
  'ULF Esports',   // Seed 11 - Pool 2 (plays seed 12) - Ascension 2025
  'Team Vitality', // Seed 12 - Pool 2 (plays seed 11)
];

/**
 * VCT Pacific Kickoff 2026 Seeding
 * Based on actual VCT 2026 format:
 * - Pool 1 (seeds 1-4): Champions 2025 qualifiers (T1, DRX, PRX, RRQ), receive bye to UB R2
 * - Pool 2 (seeds 5-12): Play in UB R1 (placed via random draw)
 *
 * UB R1 matchups: 5v6 (NS vs Secret), 7v8 (ZETA vs FULL SENSE), 9v10 (VARREL vs Global), 11v12 (DFM vs Gen.G)
 * UB R2 matchups: 1 vs winner(5v6), 2 vs winner(7v8), 3 vs winner(9v10), 4 vs winner(11v12)
 */
export const PACIFIC_KICKOFF_SEEDING: string[] = [
  'T1',              // Seed 1 - Champions 2025 qualifier (bye)
  'DRX',             // Seed 2 - Champions 2025 qualifier (bye)
  'Paper Rex',       // Seed 3 - Champions 2025 qualifier (bye)
  'Rex Regum Qeon',  // Seed 4 - Champions 2025 qualifier (bye)
  'Nongshim RedForce', // Seed 5 - Pool 2 (plays seed 6) - Ascension 2025
  'Team Secret',     // Seed 6 - Pool 2 (plays seed 5)
  'ZETA DIVISION',   // Seed 7 - Pool 2 (plays seed 8)
  'FULL SENSE',      // Seed 8 - Pool 2 (plays seed 7) - replaced Talon for 2026
  'VARREL',          // Seed 9 - Pool 2 (plays seed 10) - Ascension 2025
  'Global Esports',  // Seed 10 - Pool 2 (plays seed 9)
  'DetonatioN FocusMe', // Seed 11 - Pool 2 (plays seed 12)
  'Gen.G',           // Seed 12 - Pool 2 (plays seed 11)
];

/**
 * VCT China Kickoff 2026 Seeding
 * Based on actual VCT 2026 format:
 * - Pool 1 (seeds 1-4): Champions 2025 qualifiers (EDG, BLG, XLG, DRG), receive bye to UB R2
 * - Pool 2 (seeds 5-12): Play in UB R1
 *
 * UB R1 matchups: 5v6 (Trace vs Wolves), 7v8 (FPX vs TYLOO), 9v10 (AG vs Nova), 11v12 (JDG vs Titan)
 * UB R2 matchups: 1 vs winner(5v6), 2 vs winner(7v8), 3 vs winner(9v10), 4 vs winner(11v12)
 */
export const CHINA_KICKOFF_SEEDING: string[] = [
  'EDward Gaming',     // Seed 1 - Champions 2025 qualifier (bye)
  'Bilibili Gaming',   // Seed 2 - Champions 2025 qualifier (bye)
  'Xi Lai Gaming',     // Seed 3 - Champions 2025 qualifier (bye) - XLG
  'Dragon Ranger Gaming', // Seed 4 - Champions 2025 qualifier (bye) - Ascension 2025
  'Trace Esports',     // Seed 5 - Pool 2 (plays seed 6)
  'Wolves Esports',    // Seed 6 - Pool 2 (plays seed 5)
  'FunPlus Phoenix',   // Seed 7 - Pool 2 (plays seed 8)
  'TYLOO',             // Seed 8 - Pool 2 (plays seed 7)
  'All Gamers',        // Seed 9 - Pool 2 (plays seed 10)
  'Nova Esports',      // Seed 10 - Pool 2 (plays seed 9)
  'JD Gaming',         // Seed 11 - Pool 2 (plays seed 12)
  'Titan Esports Club', // Seed 12 - Pool 2 (plays seed 11)
];

/**
 * Number of free agents per region
 */
export const FREE_AGENTS_PER_REGION = 30;

/**
 * T2 Academy/Challenger team templates by region
 * These teams have moderate skill (60-70 overall) and 70% scrim efficiency
 */
export const T2_TEAM_TEMPLATES: Record<Region, string[]> = {
  Americas: [
    'Sentinels Academy',
    'C9 Challengers',
    '100T Academy',
    'NRG Rising',
    'LOUD Academy',
    'FURIA Challengers',
    'G2 Academy',
    'Leviatán Rising',
  ],
  EMEA: [
    'Fnatic Academy',
    'TL Rising',
    'Karmine Academy',
    'NAVI Junior',
    'Heretics Academy',
    'Vitality Rising',
    'Giants Academy',
    'KOI Challengers',
  ],
  Pacific: [
    'PRX Academy',
    'DRX Challengers',
    'T1 Academy',
    'Gen.G Rising',
    'ZETA Academy',
    'Secret Rising',
    'Talon Academy',
    'Global Rising',
  ],
  China: [
    'EDG Academy',
    'BLG Rising',
    'FPX Challengers',
    'JDG Academy',
    'Nova Rising',
    'Dragon Academy',
    'TYLOO Junior',
    'Titan Rising',
  ],
};

/**
 * T3 Amateur/Community team templates by region
 * These teams have lower skill (45-60 overall) and 40% scrim efficiency
 */
export const T3_TEAM_TEMPLATES: Record<Region, string[]> = {
  Americas: [
    'Radiant Warriors',
    'Immortal Stars',
    'Diamond Kings',
    'Ranked Demons',
    'Weekend Warriors',
    'Stack Masters',
    'Five Stack',
    'Grind Time',
  ],
  EMEA: [
    'Amateur Elite',
    'Grassroots Gaming',
    'Community Champions',
    'Rising Talent',
    'EU Grinders',
    'Nordic Wolves',
    'Iberian Lions',
    'UK Titans',
  ],
  Pacific: [
    'APAC Stars',
    'SEA Champions',
    'Japan Rising',
    'Korea Grinders',
    'Pacific Storm',
    'Southeast Elite',
    'Oceanic Wolves',
    'Asia United',
  ],
  China: [
    'CN Stars',
    'Dragon Warriors',
    'Phoenix Rising',
    'Jade Elite',
    'Golden Dragons',
    'Red Warriors',
    'Dynasty Gaming',
    'Imperial Forces',
  ],
};

/**
 * T2 team stat ranges (overall 60-70)
 */
export const T2_STAT_RANGES = {
  min: 55,
  max: 72,
  potentialMin: 65,
  potentialMax: 80,
};

/**
 * T3 team stat ranges (overall 45-60)
 */
export const T3_STAT_RANGES = {
  min: 40,
  max: 62,
  potentialMin: 55,
  potentialMax: 72,
};
