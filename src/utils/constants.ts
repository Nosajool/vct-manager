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
export const VCT_TEAMS: Record<Region, { name: string; orgValue: number; fanbase: number }[]> = {
  Americas: [
    { name: 'Sentinels', orgValue: 5000000, fanbase: 95 },
    { name: 'Cloud9', orgValue: 4500000, fanbase: 90 },
    { name: '100 Thieves', orgValue: 4000000, fanbase: 85 },
    { name: 'NRG', orgValue: 3500000, fanbase: 75 },
    { name: 'Evil Geniuses', orgValue: 3500000, fanbase: 70 },
    { name: 'LOUD', orgValue: 4000000, fanbase: 88 },
    { name: 'FURIA', orgValue: 3000000, fanbase: 72 },
    { name: 'MIBR', orgValue: 3200000, fanbase: 78 },
    { name: 'Leviatán', orgValue: 2800000, fanbase: 68 },
    { name: 'KRÜ Esports', orgValue: 2500000, fanbase: 65 },
  ],
  EMEA: [
    { name: 'Fnatic', orgValue: 4500000, fanbase: 92 },
    { name: 'Team Liquid', orgValue: 4200000, fanbase: 88 },
    { name: 'Team Vitality', orgValue: 3800000, fanbase: 80 },
    { name: 'Karmine Corp', orgValue: 3500000, fanbase: 85 },
    { name: 'Team Heretics', orgValue: 3200000, fanbase: 75 },
    { name: 'NAVI', orgValue: 3800000, fanbase: 82 },
    { name: 'FUT Esports', orgValue: 2800000, fanbase: 70 },
    { name: 'BBL Esports', orgValue: 2600000, fanbase: 68 },
    { name: 'Giants Gaming', orgValue: 2500000, fanbase: 65 },
    { name: 'KOI', orgValue: 3000000, fanbase: 78 },
  ],
  Pacific: [
    { name: 'Paper Rex', orgValue: 3500000, fanbase: 88 },
    { name: 'DRX', orgValue: 4000000, fanbase: 90 },
    { name: 'T1', orgValue: 4500000, fanbase: 92 },
    { name: 'Gen.G', orgValue: 4200000, fanbase: 85 },
    { name: 'ZETA DIVISION', orgValue: 3200000, fanbase: 82 },
    { name: 'DetonatioN Gaming', orgValue: 2800000, fanbase: 70 },
    { name: 'Global Esports', orgValue: 2500000, fanbase: 65 },
    { name: 'Team Secret', orgValue: 3000000, fanbase: 72 },
    { name: 'Talon Esports', orgValue: 2600000, fanbase: 68 },
    { name: 'Rex Regum Qeon', orgValue: 2400000, fanbase: 62 },
  ],
  China: [
    { name: 'EDward Gaming', orgValue: 4500000, fanbase: 90 },
    { name: 'Bilibili Gaming', orgValue: 4000000, fanbase: 85 },
    { name: 'FunPlus Phoenix', orgValue: 4200000, fanbase: 88 },
    { name: 'JD Gaming', orgValue: 3800000, fanbase: 82 },
    { name: 'Nova Esports', orgValue: 3200000, fanbase: 75 },
    { name: 'All Gamers', orgValue: 2800000, fanbase: 68 },
    { name: 'Dragon Ranger Gaming', orgValue: 2600000, fanbase: 65 },
    { name: 'Wolves Esports', orgValue: 2500000, fanbase: 62 },
    { name: 'Titan Esports Club', orgValue: 2400000, fanbase: 60 },
    { name: 'TYLOO', orgValue: 3000000, fanbase: 72 },
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
  defaultMorale: 75,
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
export const TEAMS_PER_REGION = 10;

/**
 * Number of free agents per region
 */
export const FREE_AGENTS_PER_REGION = 30;
