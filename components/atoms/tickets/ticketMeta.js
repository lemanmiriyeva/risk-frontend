import {C} from "@/components/theme/tokens";

export const STATUS_META = {
    new: {label: 'Yeni', fg: '#08559A', bg: 'rgba(10,108,194,0.10)', dot: '#0A6CC2'},
    open: {label: 'Qəbul edildi', fg: '#6B4FB5', bg: 'rgba(107,79,181,0.10)', dot: '#6B4FB5'},
    in_progress: {label: 'İcradadır', fg: '#8A5A2E', bg: 'rgba(180,105,14,0.12)', dot: '#D9731A'},
    waiting: {label: 'Cavab gözlənilir', fg: '#7A6A12', bg: 'rgba(201,154,30,0.14)', dot: '#C99A1E'},
    resolved: {label: 'Həll edildi', fg: '#1F7A4D', bg: 'rgba(31,122,77,0.10)', dot: '#1F7A4D'},
    closed: {label: 'Bağlandı', fg: C.inkMuted, bg: C.surfaceDeep, dot: '#8693A7'},
    canceled: {label: 'Ləğv edildi', fg: C.inkMuted, bg: C.surfaceDeep, dot: '#B5BFCE'},
};

export const PRIORITY_META = {
    low: {label: 'Aşağı', fg: '#55657D', bg: 'rgba(85,101,125,0.10)', color: '#8693A7'},
    medium: {label: 'Orta', fg: '#08559A', bg: 'rgba(10,108,194,0.10)', color: '#0A6CC2'},
    high: {label: 'Yüksək', fg: '#B4690E', bg: 'rgba(180,105,14,0.12)', color: '#D9731A'},
    critical: {label: 'Kritik', fg: '#C42F3D', bg: 'rgba(196,47,61,0.10)', color: '#C42F3D'},
};

export const DEPT_STATUS_META = {
    pending: {label: 'Gözləyir', fg: C.inkMuted, bg: C.surfaceDeep},
    in_progress: {label: 'İcradadır', fg: '#8A5A2E', bg: 'rgba(180,105,14,0.12)'},
    done: {label: 'Tamamlandı', fg: '#1F7A4D', bg: 'rgba(31,122,77,0.10)'},
};

export const ASSIGNEE_STATUS_META = {
    assigned: {label: 'Təyin olunub', fg: C.inkMuted},
    in_progress: {label: 'İcradadır', fg: '#8A5A2E'},
    done: {label: 'Tamamlayıb', fg: '#1F7A4D'},
};

export const BOARD_COLUMNS = ['new', 'open', 'in_progress', 'waiting', 'resolved'];

export const ACTIVITY_TEXT = {
    created: () => 'müraciəti yaratdı',
    status_changed: (d) => `statusu dəyişdi: ${STATUS_META[d.from]?.label || d.from} → ${STATUS_META[d.to]?.label || d.to}${d.auto ? ' (avtomatik)' : ''}`,
    reopened: (d) => `müraciəti yenidən açdı (${STATUS_META[d.from]?.label || d.from} → ${STATUS_META[d.to]?.label || d.to})`,
    priority_changed: (d) => `prioriteti dəyişdi: ${PRIORITY_META[d.from]?.label || d.from} → ${PRIORITY_META[d.to]?.label || d.to}`,
    category_changed: (d) => `kateqoriyanı dəyişdi: ${d.from || '—'} → ${d.to || '—'}`,
    updated: () => 'müraciətin məlumatlarını redaktə etdi',
    assignee_changed: (d) => d.department
        ? `${d.department} şöbəsi üçün icraçı təyin etdi: ${d.assignee}`
        : (d.assignee ? `icraçı təyin etdi: ${d.assignee}` : 'icraçını götürdü'),
    assignee_added: (d) => d.self ? 'müraciəti üzərinə götürdü' : `icraçı əlavə etdi: ${d.assignee}`,
    assignee_removed: (d) => d.self ? 'müraciətdən çıxdı' : `icraçını çıxardı: ${d.assignee}`,
    assignee_status: (d) => `${d.assignee} icra statusunu dəyişdi: ${ASSIGNEE_STATUS_META[d.to]?.label || d.to}`,
    department_added: (d) => `şöbə əlavə etdi: ${d.department}`,
    department_removed: (d) => `şöbəni çıxardı: ${d.department}`,
    department_status: (d) => `${d.department} şöbəsinin statusu: ${DEPT_STATUS_META[d.to]?.label || d.to}`,
    commented: () => 'şərh yazdı',
    attachment_added: (d) => `fayl əlavə etdi: ${d.name}`,
    rated: (d) => `müraciəti ${d.rating}/5 qiymətləndirdi`,
    escalated: () => 'SLA vaxtı keçdi - müraciət eskalasiya olundu',
    watcher_changed: (d) => `izləyici əlavə etdi: ${d.added}`,
};

export function formatDateTime(v) {
    if (!v) return '—';
    try {
        return new Date(v).toLocaleString('az-AZ', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
    } catch {
        return v;
    }
}

export function timeAgo(v) {
    if (!v) return '';
    const diff = (Date.now() - new Date(v).getTime()) / 1000;
    if (diff < 60) return 'indicə';
    if (diff < 3600) return `${Math.floor(diff / 60)} dəq əvvəl`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat əvvəl`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} gün əvvəl`;
    return formatDateTime(v);
}

/** SLA qalan / keçən vaxtı oxunaqlı formada qaytarır. */
export function slaText(dueAt, isOverdue) {
    if (!dueAt) return '';
    const diffMin = Math.round((new Date(dueAt).getTime() - Date.now()) / 60000);
    const abs = Math.abs(diffMin);
    const txt = abs >= 1440 ? `${Math.floor(abs / 1440)} gün ${Math.floor((abs % 1440) / 60)} saat`
        : abs >= 60 ? `${Math.floor(abs / 60)} saat ${abs % 60} dəq` : `${abs} dəq`;
    return isOverdue || diffMin < 0 ? `${txt} gecikir` : `${txt} qalıb`;
}

export function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const MAX_FILE_MB = 10;
export const ALLOWED_EXT = 'pdf,png,jpg,jpeg,gif,webp,txt,csv,doc,docx,xls,xlsx,ppt,pptx,zip,rar,7z,log'.split(',');

export function validateFiles(files) {
    for (const f of files) {
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) return `'.${ext}' fayl növünə icazə verilmir.`;
        if (f.size > MAX_FILE_MB * 1024 * 1024) return `'${f.name}' ${MAX_FILE_MB} MB-dan böyükdür.`;
    }
    return null;
}
