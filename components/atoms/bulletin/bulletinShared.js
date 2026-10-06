"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
    // Kateqoriya idarəetməsi daha dar səlahiyyətdir: yalnız modulun öz admini
    // (və superuser). Qurum admini sənəd/xəbər yarada bilir, amma kateqoriya
    // siyahısına toxuna bilmir - ona görə ayrıca bayraq saxlanılır.
    const [categoryManager, setCategoryManager] = useState(false);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;
        // Artıq bildiyimiz halda (superuser/qurum admini) əlavə sorğuya
        // ehtiyac yoxdur - amma yenə də arxa planda yoxlayırıq ki, nəticə
        // hər zaman backend ilə üst-üstə düşsün.
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.PERMISSIONS);
                if (!cancelled) {
                    setModuleAdmin(!!res.data?.can_manage);
                    setCategoryManager(!!res.data?.can_manage_categories);
                }
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
        // Kateqoriya əlavə/redaktə - YALNIZ modul admini və superuser.
        // Qurum admini bura daxil DEYİL (bax: BulletinCategoryPermission).
        canManageCategories: !!user?.is_superuser || categoryManager,
        // Yalnız superuser/qurum admini olmayan, amma modul admini ola bilən
        // istifadəçilər üçün faydalıdır - lazım olarsa skeleton göstərmək üçün.
        checking: !knownManager && !checked,
    };
}