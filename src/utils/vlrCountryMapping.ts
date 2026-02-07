/**
 * VLR Country Code Mapping
 * Maps VLR's mod-{code} flag classes to full country names
 *
 * Example: class="flag mod-ph" → "Philippines"
 */

export const VLR_COUNTRY_CODE_MAP: Record<string, string> = {
  // North America
  'us': 'United States',
  'ca': 'Canada',
  'mx': 'Mexico',

  // South America
  'br': 'Brazil',
  'ar': 'Argentina',
  'cl': 'Chile',
  'pe': 'Peru',
  'co': 'Colombia',
  'uy': 'Uruguay',
  've': 'Venezuela',
  'ec': 'Ecuador',

  // Europe
  'gb': 'United Kingdom',
  'uk': 'United Kingdom',
  'se': 'Sweden',
  'fr': 'France',
  'de': 'Germany',
  'es': 'Spain',
  'fi': 'Finland',
  'dk': 'Denmark',
  'no': 'Norway',
  'pl': 'Poland',
  'ru': 'Russia',
  'ua': 'Ukraine',
  'tr': 'Turkey',
  'nl': 'Netherlands',
  'be': 'Belgium',
  'at': 'Austria',
  'ch': 'Switzerland',
  'it': 'Italy',
  'pt': 'Portugal',
  'cz': 'Czech Republic',
  'sk': 'Slovakia',
  'hu': 'Hungary',
  'ro': 'Romania',
  'bg': 'Bulgaria',
  'hr': 'Croatia',
  'rs': 'Serbia',
  'si': 'Slovenia',
  'ee': 'Estonia',
  'lv': 'Latvia',
  'lt': 'Lithuania',
  'ie': 'Ireland',
  'gr': 'Greece',

  // Middle East & Africa
  'il': 'Israel',
  'sa': 'Saudi Arabia',
  'ae': 'United Arab Emirates',
  'eg': 'Egypt',
  'za': 'South Africa',
  'ma': 'Morocco',
  'tn': 'Tunisia',

  // Asia-Pacific
  'kr': 'South Korea',
  'jp': 'Japan',
  'ph': 'Philippines',
  'th': 'Thailand',
  'id': 'Indonesia',
  'sg': 'Singapore',
  'my': 'Malaysia',
  'vn': 'Vietnam',
  'tw': 'Taiwan',
  'hk': 'Hong Kong',
  'mo': 'Macau',
  'in': 'India',
  'pk': 'Pakistan',
  'bd': 'Bangladesh',
  'lk': 'Sri Lanka',
  'np': 'Nepal',
  'kh': 'Cambodia',
  'mm': 'Myanmar',
  'la': 'Laos',
  'bn': 'Brunei',
  'mn': 'Mongolia',
  'kz': 'Kazakhstan',

  // Oceania
  'au': 'Australia',
  'nz': 'New Zealand',

  // China
  'cn': 'China',

  // Additional countries
  'am': 'Armenia',
  'az': 'Azerbaijan',
  'ge': 'Georgia',
  'by': 'Belarus',
  'md': 'Moldova',
  'al': 'Albania',
  'mk': 'North Macedonia',
  'ba': 'Bosnia and Herzegovina',
  'me': 'Montenegro',
  'xk': 'Kosovo',
};

/**
 * Convert VLR country code (from mod-{code} class) to full country name
 * @param code - The country code (e.g., "ph", "us", "kr")
 * @returns Full country name, or null if unknown
 */
export function getCountryFromVlrCode(code: string): string | null {
  const normalized = code.toLowerCase().trim();
  return VLR_COUNTRY_CODE_MAP[normalized] || null;
}

/**
 * Extract country code from VLR flag class string
 * @param flagClass - Full class string (e.g., "flag mod-ph")
 * @returns Country code (e.g., "ph"), or null if not found
 */
export function extractCountryCodeFromClass(flagClass: string): string | null {
  const match = flagClass.match(/mod-([a-z]{2,3})/i);
  return match ? match[1].toLowerCase() : null;
}
