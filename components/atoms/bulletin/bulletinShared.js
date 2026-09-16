"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";

/* --------------------------------------------------------------------- */
/*  Palitra                                                               */
/* --------------------------------------------------------------------- */

export const C = {
    surface: '#FFFFFF',
    surfaceRaised: '#FBFAF6',
    surfaceDeep: '#F4F2EB',
    line: '#E4E1D8',
    lineStrong: '#D0CCC0',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    gold: '#9C7A2E',
    goldDeep: '#7A5D1F',
    goldTint: 'rgba(156,122,46,0.10)',
    danger: '#A23B3B',
    dangerTint: 'rgba(162,59,59,0.08)',
};

/**
 * Kateqoriyalar (Fərman/Sərəncam/Daxili qayda/...) artıq sabit siyahı deyil -
 * backend-də `bulletin.BulletinCategory` cədvəlindən idarə olunur (bax:
 * useBulletinCategories aşağıda). Burada yalnız backend-in `icon` sahəsini
 * (bax: BulletinCategory.ICON_CHOICES) MUI ikonuna çevirən sabit lüğət qalır -
 * yeni ikon əlavə etmək üçün hər iki tərəfdə (burada və modeldə) əlavə edin.
 */
export const ICON_MAP = {
    gavel: GavelOutlinedIcon,
    assignment: AssignmentOutlinedIcon,
    rule: RuleOutlinedIcon,
    description: DescriptionOutlinedIcon,
    article: ArticleOutlinedIcon,
    policy: PolicyOutlinedIcon,
    campaign: CampaignOutlinedIcon,
    event_note: EventNoteOutlinedIcon,
    shield: ShieldOutlinedIcon,
    folder: FolderOutlinedIcon,
};

export function CategoryIcon({icon, sx}) {
    const Cmp = ICON_MAP[icon] || DescriptionOutlinedIcon;
    return <Cmp sx={{fontSize: 18, ...sx}}/>;
}

/**
 * Bütün bulletin kateqoriyalarını (aktiv + admin görürsə deaktivlər də)
 * backend-dən çəkir. Bir neçə komponent (lövhə, sənəd arxivi, sənəd forması)
 * bu hook-u paralel çağıra bilər - hər biri öz nüsxəsini saxlayır, əlavə
 * keşləmə lazım deyil, çünki siyahı kiçikdir və nadir dəyişir.
 */
export function useBulletinCategories() {
    const {enqueueSnackbar} = useSnackbar();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.CATEGORIES);
            setCategories(normalizeList(res.data));
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { reload(); }, [reload]);

    return {categories, loading, reload};
}

/* --------------------------------------------------------------------- */
/*  Ümumi sx-lər                                                          */
/* --------------------------------------------------------------------- */

export const panelSx = {
    backgroundColor: C.surface,
    border: `1px solid ${C.line}`,
    borderRadius: '12px',
};

export const dialogPaperSx = {
    backgroundColor: C.surface,
    backgroundImage: 'none',
    borderRadius: '14px',
    border: `1px solid ${C.line}`,
};

export const fieldSx = {
    '& .MuiOutlinedInput-root': {borderRadius: '8px'},
};

export const pageWrapSx = {
    p: {xs: 2.5, sm: 4, md: 6},
    maxWidth: {xs: '100%', sm: '94%', lg: 1400},
    mx: 'auto',
};

export const softButtonSx = {
    textTransform: 'none',
    fontWeight: 600,
    fontSize: 12.5,
    borderRadius: '8px',
    color: C.goldDeep,
    backgroundColor: C.goldTint,
    px: 1.5,
    '&:hover': {backgroundColor: 'rgba(156,122,46,0.18)'},
};

export const primaryButtonSx = {
    backgroundColor: C.ink,
    color: '#fff',
    textTransform: 'none',
    boxShadow: 'none',
    borderRadius: '8px',
    '&:hover': {backgroundColor: C.gold, boxShadow: 'none'},
};

/* --------------------------------------------------------------------- */
/*  Köməkçi funksiyalar                                                   */
/* --------------------------------------------------------------------- */

export function toDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDay(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString('az-AZ', {day: '2-digit', month: 'long'}) : '';
}

export function formatFull(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString('az-AZ', {day: '2-digit', month: 'long', year: 'numeric'}) : '';
}

export function formatShort(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString('az-AZ', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '';
}

export function dayNumber(value) {
    const d = toDate(value);
    return d ? String(d.getDate()).padStart(2, '0') : '--';
}

export function monthShort(value) {
    const d = toDate(value);
    return d ? d.toLocaleDateString('az-AZ', {month: 'short'}).replace('.', '') : '';
}

export function relativeDays(value) {
    const d = toDate(value);
    if (!d) return '';
    const today = new Date();
    const diff = Math.round((d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
    if (diff === 0) return 'Bu gün';
    if (diff === 1) return 'Sabah';
    if (diff === -1) return 'Dünən';
    if (diff < 0 && diff > -7) return `${Math.abs(diff)} gün əvvəl`;
    if (diff > 0 && diff < 7) return `${diff} gün sonra`;
    return '';
}

export function initials(name) {
    const parts = (name || '').trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (name || '?').slice(0, 2).toUpperCase();
}

/** Backend həm massiv, həm də {results: []} qaytara bilər - ikisini də qəbul edirik. */
export function normalizeList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

export function readingTime(text) {
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    if (!words) return '';
    return `${Math.max(1, Math.round(words / 180))} dəq oxunuş`;
}

/* --------------------------------------------------------------------- */
/*  Kiçik UI bloklar                                                      */
/* --------------------------------------------------------------------- */

export function SectionHead({icon, title, count, action, dense}) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.25,
            px: dense ? 1.75 : 2.5, pt: dense ? 1.75 : 2.5, pb: dense ? 1.25 : 1.75,
        }}>
            {icon && (
                <Box sx={{
                    width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                    backgroundColor: C.goldTint, color: C.gold,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {icon}
                </Box>
            )}
            <Box sx={{minWidth: 0, flex: 1}}>
                <Typography sx={{fontSize: dense ? 13.5 : 15.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em'}}>
                    {title}
                </Typography>
            </Box>
            {count !== undefined && count !== null && (
                <Box sx={{
                    minWidth: 22, height: 20, px: 0.75, borderRadius: '6px',
                    backgroundColor: C.surfaceDeep, color: C.inkMuted,
                    fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {count}
                </Box>
            )}
            {action}
        </Box>
    );
}

export function GoldRule() {
    return <Box sx={{height: 2, width: 34, backgroundColor: C.gold, borderRadius: 2}}/>;
}

export function EmptyState({title, hint, icon}) {
    return (
        <Box sx={{py: 5, px: 2, textAlign: 'center'}}>
            {icon && <Box sx={{color: C.lineStrong, mb: 1}}>{icon}</Box>}
            <Typography sx={{fontSize: 13.5, fontWeight: 600, color: C.inkMuted}}>{title}</Typography>
            {hint && <Typography sx={{fontSize: 12.5, color: C.inkFaint, mt: 0.5}}>{hint}</Typography>}
        </Box>
    );
}

/* --------------------------------------------------------------------- */
/*  Sənəd forması (əlavə / redaktə)                                       */
/* --------------------------------------------------------------------- */

export function CircularFormDialog({open, onClose, onSaved, categories, defaultCategoryId, isRoot, organizations, initial}) {
    const {enqueueSnackbar} = useSnackbar();
    const isEdit = !!initial?.id;
    const fallbackCategoryId = defaultCategoryId || categories?.[0]?.id || '';
    const [form, setForm] = useState({category: fallbackCategoryId, title: '', number: '', document_date: '', organization: ''});
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm({
            category: initial?.category || defaultCategoryId || categories?.[0]?.id || '',
            title: initial?.title || '',
            number: initial?.number || '',
            document_date: initial?.document_date ? String(initial.document_date).slice(0, 10) : '',
            organization: initial?.organization || '',
        });
        setFile(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, defaultCategoryId, initial]);

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim()) {
            enqueueSnackbar('Başlıq doldurulmalıdır.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            const isMultipart = !!file;
            let payload;
            if (isMultipart) {
                payload = new FormData();
                payload.append('category', form.category);
                payload.append('title', form.title);
                if (form.number) payload.append('number', form.number);
                if (form.document_date) payload.append('document_date', form.document_date);
                if (isRoot && form.organization) payload.append('organization', form.organization);
                payload.append('file', file);
            } else {
                payload = {
                    category: form.category,
                    title: form.title,
                    number: form.number || '',
                    document_date: form.document_date || null,
                };
                if (isRoot && form.organization) payload.organization = form.organization;
            }
            const config = isMultipart ? {headers: {'Content-Type': 'multipart/form-data'}} : undefined;
            if (isEdit) {
                await service_api.patch(NEXT_API_ENDPOINTS.BULLETIN.CIRCULAR_DETAIL(initial.id), payload, config);
                enqueueSnackbar('Sənəd yeniləndi.', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.BULLETIN.CIRCULARS, payload, config);
                enqueueSnackbar('Sənəd əlavə edildi.', {variant: 'success'});
            }
            onSaved?.();
            onClose();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
                PaperProps={{sx: dialogPaperSx, component: 'form', onSubmit: handleSubmit}}>
            <Box sx={{
                px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`,
            }}>
                <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>
                    {isEdit ? 'Sənədi redaktə et' : 'Yeni sənəd'}
                </Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small"/></IconButton>
            </Box>
            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2}}>
                <TextField select label="Növ" size="small" fullWidth sx={fieldSx}
                           value={form.category} onChange={(e) => set('category', e.target.value)}
                           helperText={!categories?.length ? 'Əvvəlcə "Kateqoriyalar" bölməsindən növ əlavə edin.' : ' '}>
                    {(categories || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
                </TextField>
                <TextField label="Başlıq" required size="small" fullWidth sx={fieldSx}
                           value={form.title} onChange={(e) => set('title', e.target.value)}/>
                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField label="Nömrə" size="small" fullWidth sx={fieldSx}
                               value={form.number} onChange={(e) => set('number', e.target.value)}/>
                    <TextField label="Tarix" type="date" size="small" fullWidth sx={fieldSx}
                               InputLabelProps={{shrink: true}}
                               value={form.document_date} onChange={(e) => set('document_date', e.target.value)}/>
                </Box>
                {isRoot && (
                    <TextField select label="Qurum" size="small" fullWidth sx={fieldSx}
                               helperText="Boş saxlasanız sənəd bütün qurumlara görünəcək."
                               value={form.organization} onChange={(e) => set('organization', e.target.value)}>
                        <MenuItem value="">Bütün qurumlar</MenuItem>
                        {(organizations || []).map((o) => <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>)}
                    </TextField>
                )}
                <Button component="label" variant="outlined" startIcon={<AttachFileIcon/>}
                        sx={{textTransform: 'none', borderColor: C.line, color: C.inkMuted, justifyContent: 'flex-start'}}>
                    {file ? file.name : (isEdit ? 'Faylı dəyiş' : 'Fayl əlavə et (PDF, DOCX)')}
                    <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)}/>
                </Button>
            </Box>
            <Box sx={{px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: `1px solid ${C.line}`}}>
                <Button onClick={onClose} disabled={saving} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                <Button type="submit" variant="contained" disabled={saving} sx={primaryButtonSx}>
                    {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : (isEdit ? 'Yadda saxla' : 'Əlavə et')}
                </Button>
            </Box>
        </Dialog>
    );
}

/* --------------------------------------------------------------------- */
/*  Xəbər forması (əlavə / redaktə)                                       */
/* --------------------------------------------------------------------- */

export function NewsFormDialog({open, onClose, onSaved, initial}) {
    const {enqueueSnackbar} = useSnackbar();
    const isEdit = !!initial?.id;
    const [form, setForm] = useState({title: '', summary: '', body: ''});
    const [image, setImage] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        setForm({
            title: initial?.title || '',
            summary: initial?.summary || '',
            body: initial?.body || '',
        });
        setImage(null);
    }, [open, initial]);

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim()) {
            enqueueSnackbar('Başlıq doldurulmalıdır.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            const isMultipart = !!image;
            let payload;
            if (isMultipart) {
                payload = new FormData();
                payload.append('title', form.title);
                payload.append('summary', form.summary || '');
                payload.append('body', form.body || '');
                payload.append('image', image);
            } else {
                payload = {title: form.title, summary: form.summary || '', body: form.body || ''};
            }
            const config = isMultipart ? {headers: {'Content-Type': 'multipart/form-data'}} : undefined;
            if (isEdit) {
                await service_api.patch(NEXT_API_ENDPOINTS.BULLETIN.NEWS_DETAIL(initial.id), payload, config);
                enqueueSnackbar('Xəbər yeniləndi.', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.BULLETIN.NEWS, payload, config);
                enqueueSnackbar('Xəbər dərc edildi.', {variant: 'success'});
            }
            onSaved?.();
            onClose();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
                PaperProps={{sx: dialogPaperSx, component: 'form', onSubmit: handleSubmit}}>
            <Box sx={{
                px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`,
            }}>
                <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>
                    {isEdit ? 'Xəbəri redaktə et' : 'Yeni xəbər'}
                </Typography>
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small"/></IconButton>
            </Box>
            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2}}>
                <TextField label="Başlıq" required size="small" fullWidth sx={fieldSx}
                           value={form.title} onChange={(e) => set('title', e.target.value)}/>
                <TextField label="Qısa xülasə" size="small" fullWidth multiline minRows={2} sx={fieldSx}
                           helperText="Siyahıda başlığın altında görünür."
                           value={form.summary} onChange={(e) => set('summary', e.target.value)}/>
                <TextField label="Mətn" size="small" fullWidth multiline minRows={6} sx={fieldSx}
                           value={form.body} onChange={(e) => set('body', e.target.value)}/>
                <Button component="label" variant="outlined" startIcon={<ImageOutlinedIcon/>}
                        sx={{textTransform: 'none', borderColor: C.line, color: C.inkMuted, justifyContent: 'flex-start'}}>
                    {image ? image.name : (isEdit ? 'Şəkli dəyiş' : 'Şəkil əlavə et')}
                    <input type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files?.[0] || null)}/>
                </Button>
            </Box>
            <Box sx={{px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: `1px solid ${C.line}`}}>
                <Button onClick={onClose} disabled={saving} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                <Button type="submit" variant="contained" disabled={saving} sx={primaryButtonSx}>
                    {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : (isEdit ? 'Yadda saxla' : 'Dərc et')}
                </Button>
            </Box>
        </Dialog>
    );
}

/* --------------------------------------------------------------------- */
/*  İdarəetmə icazəsi                                                     */
/* --------------------------------------------------------------------- */

/**
 * Superuser və qurum admini həmişə idarə edə bilir - bunu dərhal (sorğu
 * gözləmədən) bilirik, çünki bu məlumat artıq `user` obyektindədir.
 * Amma modulun KONKRET admini (Module.admin_users - məsələn, kimsə yalnız
 * "Elanlar" modulunun admini təyin edilib, superuser/qurum admini deyil) bu
 * məlumatı frontend-in əlində olmayıb - bunun üçün backend-dən soruşuruq
 * (bax: GET /bulletin/permissions/ -> BulletinPermissionsView).
 */
export function useCanManageBulletin() {
    const user = useAppSelector((state) => state.user);
    const knownManager = !!user?.is_superuser || !!user?.is_org_admin;

    const [moduleAdmin, setModuleAdmin] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;
        // Artıq bildiyimiz halda (superuser/qurum admini) əlavə sorğuya
        // ehtiyac yoxdur - amma yenə də arxa planda yoxlayırıq ki, nəticə
        // hər zaman backend ilə üst-üstə düşsün.
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.PERMISSIONS);
                if (!cancelled) setModuleAdmin(!!res.data?.can_manage);
            } catch (err) {
                // Sorğu uğursuz olsa, ən azı bildiyimiz (superuser/qurum admini)
                // vəziyyətdə qalırıq - istifadəçini kor-koranə əlavə funksiyalara
                // buraxmırıq, amma tamamilə kilidləmirik.
            } finally {
                if (!cancelled) setChecked(true);
            }
        })();
        return () => { cancelled = true; };
    }, [user?.id]);

    return {
        canManage: knownManager || moduleAdmin,
        // Yalnız superuser/qurum admini olmayan, amma modul admini ola bilən
        // istifadəçilər üçün faydalıdır - lazım olarsa skeleton göstərmək üçün.
        checking: !knownManager && !checked,
    };
}