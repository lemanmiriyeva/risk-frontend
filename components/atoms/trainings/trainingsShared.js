"use client"
import {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {C} from "../bulletin/bulletinShared";

export {
    C, panelSx, dialogPaperSx, fieldSx, pageWrapSx, softButtonSx, primaryButtonSx,
    formatFull, formatShort, EmptyState, SectionHead,
} from "../bulletin/bulletinShared";

export const TRAINING_ROUTES = {
    ROOT: '/telimler',
    MATERIALS: '/telimler/materiallar',
    MATERIAL: (id) => `/telimler/materiallar/${id}`,
    STATISTICS: '/telimler/statistika',
};

/**
 * Cari istifadəçinin Təlimlər modulundakı səlahiyyətləri. "Materiallar" və
 * "Statistika" alt modullarının girişi və admini AYRI-AYRILIQDA təyin olunur.
 */
export function useTrainingPermissions() {
    const [perms, setPerms] = useState({
        loaded: false,
        can_view_materials: false,
        can_manage_materials: false,
        can_view_statistics: false,
        can_manage_statistics: false,
    });

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.TRAININGS.PERMISSIONS);
                if (alive) setPerms({...res.data, loaded: true});
            } catch {
                if (alive) setPerms((p) => ({...p, loaded: true}));
            }
        })();
        return () => { alive = false; };
    }, []);

    return perms;
}

export function formatDuration(seconds) {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    if (!total) return '—';
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const STATUS_STYLES = {
    completed: {label: 'Tam baxılıb', color: '#2E6B3F', bg: 'rgba(46,107,63,0.10)'},
    in_progress: {label: 'Yarımçıq', color: '#9C6B1E', bg: 'rgba(156,107,30,0.12)'},
    not_started: {label: 'Baxılmayıb', color: C.inkMuted, bg: 'rgba(0,0,0,0.05)'},
    passed: {label: 'Keçdi', color: '#2E6B3F', bg: 'rgba(46,107,63,0.10)'},
    failed: {label: 'Keçmədi', color: C.danger, bg: C.dangerTint},
    archived: {label: 'Arxivdə', color: C.inkMuted, bg: 'rgba(0,0,0,0.06)'},
};

export function StatusPill({status, label}) {
    const st = STATUS_STYLES[status] || STATUS_STYLES.not_started;
    return (
        <Box component="span" sx={{
            display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25, borderRadius: '999px',
            backgroundColor: st.bg, color: st.color, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap',
        }}>
            {label || st.label}
        </Box>
    );
}

export function NoAccess({text}) {
    return (
        <Box sx={{minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3}}>
            <Box sx={{textAlign: 'center', maxWidth: 420}}>
                <Typography sx={{fontSize: 20, fontWeight: 700, color: C.ink, mb: 1}}>Giriş icazəniz yoxdur</Typography>
                <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                    {text || 'Bu bölməyə giriş üçün sistem administratoru ilə əlaqə saxlayın.'}
                </Typography>
            </Box>
        </Box>
    );
}
