"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {Box, IconButton, Skeleton, Typography} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {BRAND, C} from "@/components/theme/tokens";
import {panelSx} from "@/components/atoms/bulletin/bulletinShared";

export const KINDS = {
    holiday: {label: 'Bayram', color: '#1F7A4D'},
    mourning: {label: 'Hüzn günü', color: '#4B5563'},
    significant: {label: 'Əlamətdar gün', color: '#C99A1E'},
    birthday: {label: 'Ad günü', color: '#0A6CC2'},
};

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const WEEKDAYS = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function localToday() {
    const d = new Date();
    return {y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate()};
}

export default function HomeCalendar() {
    const now = useMemo(localToday, []);
    const [view, setView] = useState({y: now.y, m: now.m});
    const [selected, setSelected] = useState(iso(now.y, now.m, now.d));
    const [data, setData] = useState({entries: [], birthdays: [], can_manage: false});
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (y, m) => {
        setLoading(true);
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.AGENDA.CALENDAR}?year=${y}&month=${m}`);
            setData(res.data);
        } catch {
            setData({entries: [], birthdays: [], can_manage: false});
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(view.y, view.m); }, [view, load]);

    // tarix -> [{kind, title}]
    const byDate = useMemo(() => {
        const map = {};
        const add = (date, kind, title) => { (map[date] ||= []).push({kind, title}); };
        data.entries.forEach((e) => add(e.date, e.kind, e.title));
        data.birthdays.forEach((b) => add(b.date, 'birthday', b.name));
        return map;
    }, [data]);

    const move = (delta) => {
        const d = new Date(view.y, view.m - 1 + delta, 1);
        setView({y: d.getFullYear(), m: d.getMonth() + 1});
    };

    const first = new Date(view.y, view.m - 1, 1);
    const offset = (first.getDay() + 6) % 7; // həftə bazar ertəsi başlayır
    const daysInMonth = new Date(view.y, view.m, 0).getDate();
    const cells = [...Array(offset).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];
    const todayIso = iso(now.y, now.m, now.d);
    const dayItems = byDate[selected] || [];

    return (
        <Box sx={{...panelSx, p: 2}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5}}>
                <Typography sx={{fontSize: 15, fontWeight: 700, color: BRAND.navy900}}>
                    {MONTHS[view.m - 1]} {view.y}
                </Typography>
                <Box>
                    <IconButton size="small" aria-label="Əvvəlki ay" onClick={() => move(-1)}><ChevronLeftIcon fontSize="small"/></IconButton>
                    <IconButton size="small" aria-label="Növbəti ay" onClick={() => move(1)}><ChevronRightIcon fontSize="small"/></IconButton>
                </Box>
            </Box>

            <Box sx={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center'}}>
                {WEEKDAYS.map((w) => (
                    <Typography key={w} sx={{fontSize: 10.5, fontWeight: 600, color: C.inkFaint, py: 0.5}}>{w}</Typography>
                ))}
                {cells.map((day, i) => {
                    if (!day) return <Box key={`e${i}`}/>;
                    const key = iso(view.y, view.m, day);
                    const items = byDate[key] || [];
                    const kinds = [...new Set(items.map((x) => x.kind))];
                    const isToday = key === todayIso;
                    const isSel = key === selected;
                    return (
                        <Box key={key} role="button" tabIndex={0} onClick={() => setSelected(key)}
                             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(key); }}
                             sx={{
                                 cursor: 'pointer', borderRadius: '8px', py: 0.5, minHeight: 38,
                                 display: 'flex', flexDirection: 'column', alignItems: 'center',
                                 backgroundColor: isToday ? BRAND.navy900 : 'transparent',
                                 color: isToday ? '#fff' : C.ink,
                                 outline: isSel && !isToday ? `2px solid ${BRAND.navy600}` : 'none', outlineOffset: -2,
                                 '&:hover': {backgroundColor: isToday ? BRAND.navy900 : C.surfaceRaised},
                             }}>
                            <Typography sx={{fontSize: 12.5, fontWeight: isToday ? 800 : 500, lineHeight: '20px'}}>{day}</Typography>
                            <Box sx={{display: 'flex', gap: '3px', height: 6, mt: '2px'}}>
                                {kinds.map((k) => (
                                    <Box key={k} sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: KINDS[k].color,
                                        boxShadow: isToday ? '0 0 0 1px #fff' : 'none'}}/>
                                ))}
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: 1.5}}>
                {Object.entries(KINDS).map(([k, v]) => (
                    <Box key={k} sx={{display: 'flex', alignItems: 'center', gap: 0.6}}>
                        <Box sx={{width: 8, height: 8, borderRadius: '50%', backgroundColor: v.color}}/>
                        <Typography sx={{fontSize: 11, color: C.inkMuted}}>{v.label}</Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{mt: 1.5, pt: 1.5, borderTop: `1px solid ${C.line}`, minHeight: 56}}>
                <Typography sx={{fontSize: 12, fontWeight: 700, color: C.inkMuted, mb: 0.75}}>
                    {selected === todayIso ? 'Bu gün' : selected.split('-').reverse().join('.')}
                </Typography>
                {loading ? <Skeleton height={36}/> : dayItems.length === 0 ? (
                    <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>Bu gün üçün qeyd yoxdur.</Typography>
                ) : dayItems.map((it, i) => (
                    <Box key={i} sx={{display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75}}>
                        <Box sx={{width: 8, height: 8, borderRadius: '50%', mt: '6px', flexShrink: 0, backgroundColor: KINDS[it.kind].color}}/>
                        <Typography sx={{fontSize: 13, color: C.ink, lineHeight: 1.4}}>
                            <Box component="span" sx={{color: KINDS[it.kind].color, fontWeight: 700}}>{KINDS[it.kind].label}: </Box>
                            {it.title}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {data.can_manage && (
                <Box component={Link} href="/teqvim" sx={{display: 'inline-block', mt: 1, fontSize: 12.5, fontWeight: 600, color: BRAND.navy600, textDecoration: 'none'}}>
                    Təqvimi idarə et →
                </Box>
            )}
        </Box>
    );
}
