/* Local dashboard photographs. Add city-photos/<city-slug>.jpg, then add the
 * slug below. Existing entries become available simply by installing the file.
 * Filenames are lowercase ASCII with hyphens; jpg/jpeg/png/webp are supported.
 * Missing/failed images are transparent CSS layers over dashboard-skyline.png.
 * No image requests, listeners, save fields, or preloading are managed in JS.
 */
const CITY_PHOTOS = Object.freeze(Object.fromEntries([
  'atlanta', 'boston', 'brooklyn', 'charlotte', 'chicago', 'cleveland',
  'dallas', 'denver', 'detroit', 'houston', 'indianapolis', 'los-angeles',
  'memphis', 'miami', 'milwaukee', 'minneapolis', 'new-orleans', 'new-york',
  'oklahoma-city', 'orlando', 'philadelphia', 'phoenix', 'portland',
  'sacramento', 'salt-lake-city', 'san-antonio', 'san-francisco', 'seattle',
  'toronto', 'washington', 'las-vegas', 'uncasville', 'vancouver', 'montreal',
  'kansas-city', 'louisville', 'pittsburgh', 'baltimore', 'mexico-city',
  'newark', 'east-rutherford', 'oakland', 'san-diego', 'san-jose', 'tulsa',
  'charleston', 'savannah', 'st-louis', 'cincinnati', 'rochester', 'syracuse',
  'fort-wayne', 'buffalo'
].map(city => [city, 'city-photos/' + city + '.jpg'])));

// Regional labels are explicit presentation defaults, not historical relocations.
// New Jersey defaults to Newark; supply East Rutherford as the team's city or
// use a city-scoped override for a particular historical franchise/season.
const CITY_PHOTO_ALIASES = Object.freeze({
  'la': 'los-angeles', 'l-a': 'los-angeles', 'nyc': 'new-york',
  'new-york-city': 'new-york', 'ny': 'new-york',
  'indiana': 'indianapolis', 'minnesota': 'minneapolis',
  'salt-lake': 'salt-lake-city', 'utah': 'salt-lake-city', 'golden-state': 'san-francisco',
  'connecticut': 'uncasville', 'new-jersey': 'newark',
  'washington-dc': 'washington', 'washington-d-c': 'washington',
  'district-of-columbia': 'washington', 'saint-louis': 'st-louis',
  'okc': 'oklahoma-city', 'vegas': 'las-vegas'
});

// Optional trusted overrides, first match wins. Always include the canonical
// city so moving a franchise cannot carry its previous city's photo with it.
// Example shape (activate only with your actual stable key and desired dates):
// {key:'your-team-key', city:'memphis', from:1997, through:2000,
//  photo:'city-photos/memphis-1997.jpg'}
// Omit from/through for a franchise-specific image valid in any season.
const CITY_PHOTO_OVERRIDES = Object.freeze([]);

function cityPhotoKey(value) {
  if (typeof value !== 'string') return '';
  const key = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[.'’]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return Object.hasOwn(CITY_PHOTO_ALIASES, key) ? CITY_PHOTO_ALIASES[key] : key;
}

function resolveCityPhoto(franchise, season) {
  const city = cityPhotoKey(franchise?.city);
  if (!city) return null;
  const override = CITY_PHOTO_OVERRIDES.find(entry =>
    typeof franchise.key === 'string' && entry.key === franchise.key &&
    entry.city === city &&
    (entry.from === undefined || (Number.isInteger(season) && season >= entry.from)) &&
    (entry.through === undefined || (Number.isInteger(season) && season <= entry.through)));
  const photo = override?.photo || (Object.hasOwn(CITY_PHOTOS, city) ? CITY_PHOTOS[city] : null);
  // Only local, registry-owned filenames can enter the inline style. Neither a
  // custom city nor a saved franchise can inject a URL, HTML, or CSS declaration.
  return typeof photo === 'string' && /^city-photos\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|jpeg|png|webp)$/.test(photo)
    ? photo : null;
}

function cityPhotoBannerStyle(franchise, season) {
  const photo = resolveCityPhoto(franchise, season);
  return photo ? ` style="--gm-city-photo:url('${photo}')"` : '';
}
