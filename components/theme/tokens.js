/*
 * MİS dizayn sistemi - vahid rəng və ölçü tokenləri.
 *
 * Palitra dövlət gerbindən (loqodan) götürülüb:
 *   - Bayraq üçrəngi: mavi #00B5E2, qırmızı #EF3340, yaşıl #509E2F
 *   - Gerbin qızılı: #FFC600 / #AA8A00
 * Əsas fon tünd dövlət göyüdür, interaktiv rəng bayraq mavisinin oxunaqlı
 * (kontrastlı) tünd variantıdır, qızılı yalnız vurğu üçündür.
 *
 * Bütün komponentlər rəngləri BURADAN götürməlidir. Köhnə komponentlərdəki
 * açar adları (`gold`, `goldTint` və s.) uyğunluq üçün saxlanılıb: `gold`
 * artıq "əsas vurğu rəngi" deməkdir (bayraq mavisi), qızılı isə `crest`.
 */

export const FLAG = {
    blue: '#00B5E2',
    red: '#EF3340',
    green: '#509E2F',
};

export const BRAND = {
    navy950: '#061226',
    navy900: '#0A1B36',
    navy800: '#0F2647',
    navy700: '#173560',
    navy600: '#22477A',
    accent: '#0A6CC2',        // interaktiv rəng (düymə, link, aktiv vəziyyət)
    accentDark: '#08559A',
    accentSoft: '#E7F1FB',
    crest: '#C99A1E',         // gerbin qızılı - vurğu, nişan
    crestSoft: '#FBF3DC',
};

/* Bayraq zolağı - başlıq və kartların imza elementi. */
export const TRICOLOR = `linear-gradient(90deg, ${FLAG.blue} 0 33.33%, ${FLAG.red} 33.33% 66.66%, ${FLAG.green} 66.66% 100%)`;

/* Səkkizguşəli ulduz (bayraqdakı motiv) - fonda zəif naxış kimi istifadə olunur. */
export function starPattern(color = '#FFFFFF', opacity = 0.06, size = 120) {
    const c = encodeURIComponent(color);
    const s = size;
    const h = s / 2;
    const r1 = s * 0.28;
    const r2 = s * 0.13;
    const pts = [];
    for (let i = 0; i < 16; i++) {
        const r = i % 2 === 0 ? r1 : r2;
        const a = (Math.PI / 8) * i - Math.PI / 2;
        pts.push(`${(h + r * Math.cos(a)).toFixed(1)},${(h + r * Math.sin(a)).toFixed(1)}`);
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 ${s} ${s}'><polygon points='${pts.join(' ')}' fill='none' stroke='${c}' stroke-opacity='${opacity}' stroke-width='1.2'/></svg>`;
    return `url("data:image/svg+xml,${svg}")`;
}

/*
 * Komponentlərin ortaq palitrası. Əvvəllər hər səhifədə ayrıca `const C = {...}`
 * (bej tonlarda) təyin olunurdu; indi hamısı bu obyekti istifadə edir.
 */
export const C = {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceRaised: '#F8FAFD',
    surfaceDeep: '#EEF2F8',
    line: '#E3E8F0',
    lineStrong: '#CBD4E1',
    ink: '#0F1B2D',
    inkMuted: '#55657D',
    inkFaint: '#8693A7',

    // Vurğu (əvvəlki "qızılı" rolunu bayraq mavisi daşıyır)
    gold: BRAND.accent,
    goldDeep: BRAND.accentDark,
    goldTint: 'rgba(10,108,194,0.08)',
    goldWash: 'rgba(10,108,194,0.06)',
    goldMuted: 'rgba(10,108,194,0.32)',
    unreadBg: 'rgba(10,108,194,0.05)',

    crest: BRAND.crest,
    crestSoft: BRAND.crestSoft,

    success: '#1F7A4D',
    successTint: 'rgba(31,122,77,0.10)',
    danger: '#C42F3D',
    dangerTint: 'rgba(196,47,61,0.08)',
    warning: '#B4690E',
    warningTint: 'rgba(180,105,14,0.10)',
    approve: '#1F7A4D',
    reject: '#C42F3D',
};

/* Köhnə GOV açarları (modul başlığı, ana səhifə) - yeni dəyərlərlə. */
export const GOV = {
    navy: BRAND.navy900,
    navyMid: BRAND.navy800,
    navySoft: BRAND.navy700,
    navyElevated: BRAND.navy600,

    gold: BRAND.crest,
    goldSoft: '#E9C766',
    goldDark: '#9A7412',

    textOnNavy: '#F3F6FB',
    textOnNavyMuted: '#A9B6CC',

    pageBg: '#F3F6FA',
    cardBorder: C.line,
    textMuted: C.inkMuted,
    textPrimary: C.ink,
};

/* Modullara xas vurğu rəngləri (ana səhifə və yan menyu ikonları). */
export const MODULE_ACCENTS = {
    risk: '#C42F3D',
    inventar: '#0A6CC2',
    icazeler: '#1F7A4D',
    emeliyyatlar: '#6B4FB5',
    loqlar: '#475569',
    elanlar: '#C99A1E',
    telimler: '#0E8A9A',
    'inzibatci-paneli': '#173560',
};
export const DEFAULT_MODULE_ACCENT = BRAND.navy600;

export const FONT_STACK = '"Montserrat Variable", Montserrat, "Segoe UI", Arial, sans-serif';


/* Azərbaycan dilində tarix (brauzerin "az" lokal dəstəyindən asılı olmadan). */
const AZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
const AZ_DAYS = ['bazar', 'bazar ertəsi', 'çərşənbə axşamı', 'çərşənbə', 'cümə axşamı', 'cümə', 'şənbə'];

/* Rəqəmlə tarix: 06.10.2026 */
export function formatNumericDate(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function formatAzDate(date, {weekday = true} = {}) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const base = `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!weekday) return base;
    const w = AZ_DAYS[d.getDay()];
    return `${w.charAt(0).toUpperCase()}${w.slice(1)}, ${base}`;
}

export const SERIF_STACK = FONT_STACK; // başlıqlar da loqodakı şriftlə (Montserrat)
export const HEADER_HEIGHT = 76;
