"use client"
import React, {useCallback, useEffect, useState} from 'react';
import {Box, Button, IconButton, MenuItem, Skeleton, TextField, Typography} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {BRAND, C} from "@/components/theme/tokens";
import {fieldSx, pageWrapSx, panelSx} from "@/components/atoms/bulletin/bulletinShared";
import {KINDS} from "./HomeCalendar";

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const ENTRY_KINDS = ['holiday', 'mourning', 'significant'];

/** Təqvim admini: seçilmiş ay üçün bayram, hüzn və əlamətdar günləri daxil edir. */
export default function CalendarAdminPage() {
    const {enqueueSnackbar} = useSnackbar();
    const now = new Date();
    const [view, setView] = useState({y: now.getFullYear(), m: now.getMonth() + 1});
    const [entries, setEntries] = useState([]);
    const [canManage, setCanManage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const pad = (n) => String(n).padStart(2, '0');
    const [form, setForm] = useState({date: `${view.y}-${pad(view.m)}-01`, kind: 'holiday', title: ''});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.AGENDA.CALENDAR}?year=${view.y}&month=${view.m}`);
            setEntries(res.data.entries || []);
            setCanManage(!!res.data.can_manage);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [view, enqueueSnackbar]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setForm((f) => ({...f, date: `${view.y}-${pad(view.m)}-01`})); }, [view]);

    const move = (delta) => {
        const d = new Date(view.y, view.m - 1 + delta, 1);
        setView({y: d.getFullYear(), m: d.getMonth() + 1});
    };

    const add = async () => {
        if (!form.title.trim() || !form.date) {
            enqueueSnackbar('Tarix və ad daxil edin.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.AGENDA.ENTRIES, {...form, title: form.title.trim()});
            setForm((f) => ({...f, title: ''}));
            await load();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.AGENDA.ENTRY_DETAIL(id));
            setEntries((list) => list.filter((e) => e.id !== id));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    };

    if (canManage === false) {
        return (
            <Box sx={{...pageWrapSx, textAlign: 'center', py: 10}}>
                <Typography sx={{fontSize: 18, fontWeight: 700, color: BRAND.navy900}}>Bu bölməyə giriş icazəniz yoxdur</Typography>
                <Typography sx={{fontSize: 14, color: C.inkMuted, mt: 1}}>Təqvimi yalnız təqvim modulunun admini redaktə edə bilər.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={pageWrapSx}>
            <Typography component="h1" sx={{fontSize: 24, fontWeight: 700, color: BRAND.navy900, mb: 0.5}}>Təqvim</Typography>
            <Typography sx={{fontSize: 14, color: C.inkMuted, mb: 3}}>
                Bayram, hüzn və əlamətdar günləri hər ay buradan daxil edin. Ad günləri istifadəçi məlumatlarından avtomatik götürülür.
            </Typography>

            <Box sx={{...panelSx, p: 2.5, mb: 3}}>
                <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', md: '180px 200px 1fr auto'}, alignItems: 'center'}}>
                    <TextField type="date" size="small" label="Tarix" InputLabelProps={{shrink: true}} sx={fieldSx}
                               value={form.date} onChange={(e) => setForm({...form, date: e.target.value})}/>
                    <TextField select size="small" label="Növ" sx={fieldSx} value={form.kind}
                               onChange={(e) => setForm({...form, kind: e.target.value})}>
                        {ENTRY_KINDS.map((k) => <MenuItem key={k} value={k}>{KINDS[k].label}</MenuItem>)}
                    </TextField>
                    <TextField size="small" label="Ad" sx={fieldSx} value={form.title}
                               onChange={(e) => setForm({...form, title: e.target.value})}
                               onKeyDown={(e) => { if (e.key === 'Enter') add(); }}/>
                    <Button variant="contained" disabled={saving} onClick={add} sx={{textTransform: 'none', fontWeight: 700}}>Əlavə et</Button>
                </Box>
            </Box>

            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1.5}}>
                <IconButton size="small" onClick={() => move(-1)} aria-label="Əvvəlki ay"><ChevronLeftIcon/></IconButton>
                <Typography sx={{fontSize: 16, fontWeight: 700, minWidth: 140, textAlign: 'center'}}>{MONTHS[view.m - 1]} {view.y}</Typography>
                <IconButton size="small" onClick={() => move(1)} aria-label="Növbəti ay"><ChevronRightIcon/></IconButton>
            </Box>

            <Box sx={panelSx}>
                {loading ? (
                    <Box sx={{p: 2}}>{[0, 1, 2].map((i) => <Skeleton key={i} height={44}/>)}</Box>
                ) : entries.length === 0 ? (
                    <Typography sx={{p: 3, fontSize: 14, color: C.inkFaint}}>Bu ay üçün qeyd yoxdur.</Typography>
                ) : entries.map((e, i) => (
                    <Box key={e.id} sx={{display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5, borderTop: i ? `1px solid ${C.line}` : 'none'}}>
                        <Typography sx={{width: 92, fontSize: 13.5, fontWeight: 600, color: C.inkMuted}}>
                            {e.date.split('-').reverse().join('.')}
                        </Typography>
                        <Box component="span" sx={{fontSize: 11, fontWeight: 700, px: 1, py: '2px', borderRadius: '6px',
                            color: KINDS[e.kind].color, backgroundColor: `${KINDS[e.kind].color}1A`}}>{KINDS[e.kind].label}</Box>
                        <Typography sx={{flex: 1, fontSize: 14, color: C.ink}}>{e.title}</Typography>
                        <IconButton size="small" aria-label="Sil" onClick={() => remove(e.id)}><DeleteOutlineIcon fontSize="small"/></IconButton>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
