"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {Box, Skeleton, Typography} from '@mui/material';
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
const WEEKDAYS = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
const MAX_BIRTHDAYS = 4;

const pad = (n) => String(n).padStart(2, '0');

function localToday() {
    const d = new Date();
    return {y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), wd: d.getDay(), iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`};
}

/**
 * Ana səhifədə "Bu gün" kartı: təqvim şəbəkəsi göstərilmir - yalnız bugünün tarixi və
 * bugünə düşən bayram / hüzn / əlamətdar günlər və əməkdaşların ad günləri.
 */
export default function HomeCalendar() {
    const today = useMemo(localToday, []);
    const [data, setData] = useState({entries: [], birthdays: [], can_manage: false});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.AGENDA.CALENDAR}?year=${today.y}&month=${today.m}`);
                if (alive) setData(res.data);
            } catch {
                if (alive) setData({entries: [], birthdays: [], can_manage: false});
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [today]);

    const events = useMemo(
        () => (data.entries || []).filter((e) => e.date === today.iso).map((e) => ({kind: e.kind, title: e.title})),
        [data, today],
    );
    const birthdays = useMemo(
        () => (data.birthdays || []).filter((b) => b.date === today.iso).map((b) => b.name),
        [data, today],
    );
    const hasAnything = events.length > 0 || birthdays.length > 0;
    const shownBirthdays = birthdays.slice(0, MAX_BIRTHDAYS);
    const hiddenBirthdays = birthdays.length - shownBirthdays.length;

    return (
        <Box sx={{...panelSx, overflow: 'hidden'}}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, p: 2, borderBottom: `1px solid ${C.line}`}}>
                <Box sx={{
                    flexShrink: 0, width: 64, height: 64, borderRadius: '14px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', color: '#fff',
                    background: `linear-gradient(160deg, ${BRAND.navy800}, ${BRAND.navy600})`,
                }}>
                    <Typography sx={{fontSize: 28, fontWeight: 800, lineHeight: 1}}>{today.d}</Typography>
                    <Typography sx={{fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.85, mt: 0.25}}>
                        {MONTHS[today.m - 1].slice(0, 3)}
                    </Typography>
                </Box>
                <Box sx={{minWidth: 0}}>
                    <Typography sx={{fontSize: 11.5, fontWeight: 700, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em'}}>Bu gün</Typography>
                    <Typography sx={{fontSize: 16, fontWeight: 700, color: BRAND.navy900, lineHeight: 1.25}}>{WEEKDAYS[today.wd]}</Typography>
                    <Typography sx={{fontSize: 13, color: C.inkMuted}}>{today.d} {MONTHS[today.m - 1].toLowerCase()} {today.y}</Typography>
                </Box>
            </Box>

            <Box sx={{p: 2, minHeight: 64}}>
                {loading ? <Skeleton height={40}/> : !hasAnything ? (
                    <Typography sx={{fontSize: 13, color: C.inkFaint}}>Bu gün üçün qeyd yoxdur.</Typography>
                ) : (
                    <>
                        {events.map((it, i) => (
                            <Box key={`e${i}`} sx={{display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1}}>
                                <Box sx={{width: 8, height: 8, borderRadius: '50%', mt: '6px', flexShrink: 0, backgroundColor: (KINDS[it.kind] || KINDS.significant).color}}/>
                                <Typography sx={{fontSize: 13.5, color: C.ink, lineHeight: 1.4}}>
                                    <Box component="span" sx={{color: (KINDS[it.kind] || KINDS.significant).color, fontWeight: 700}}>
                                        {(KINDS[it.kind] || KINDS.significant).label}:{' '}
                                    </Box>
                                    {it.title}
                                </Typography>
                            </Box>
                        ))}
                        {birthdays.length > 0 && (
                            <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1}}>
                                <Box sx={{width: 8, height: 8, borderRadius: '50%', mt: '6px', flexShrink: 0, backgroundColor: KINDS.birthday.color}}/>
                                <Typography sx={{fontSize: 13.5, color: C.ink, lineHeight: 1.4}}>
                                    <Box component="span" sx={{color: KINDS.birthday.color, fontWeight: 700}}>{KINDS.birthday.label}: </Box>
                                    {shownBirthdays.join(', ')}
                                    {hiddenBirthdays > 0 && <Box component="span" sx={{color: C.inkMuted}}> və daha {hiddenBirthdays} nəfər</Box>}
                                </Typography>
                            </Box>
                        )}
                    </>
                )}

                {data.can_manage && (
                    <Box component={Link} href="/teqvim" sx={{display: 'inline-block', mt: 1.5, fontSize: 12.5, fontWeight: 600, color: BRAND.navy600, textDecoration: 'none'}}>
                        Təqvimi idarə et →
                    </Box>
                )}
            </Box>
        </Box>
    );
}