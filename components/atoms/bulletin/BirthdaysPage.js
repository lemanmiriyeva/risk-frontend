"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import SearchIcon from '@mui/icons-material/Search';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, EmptyState, fieldSx, formatDay, initials, normalizeList,
    pageWrapSx, panelSx, softButtonSx, toDate,
} from "./bulletinShared";

function PersonRow({person}) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
            borderTop: `1px solid ${C.line}`,
            '&:hover': {backgroundColor: C.surfaceRaised},
        }}>
            <Avatar src={person.image_url || undefined}
                    sx={{width: 42, height: 42, bgcolor: C.gold, color: '#fff', fontWeight: 700, fontSize: 14}}>
                {initials(person.name)}
            </Avatar>
            <Box sx={{minWidth: 0, flex: 1}}>
                <Typography sx={{fontSize: 14, fontWeight: 600, color: C.ink}}>{person.name}</Typography>
                <Typography sx={{fontSize: 12, color: C.inkMuted}}>
                    {[person.role_name, person.department_name].filter(Boolean).join(' · ') || '—'}
                </Typography>
            </Box>
            {person.is_today && (
                <Chip label="Bu gün" size="small"
                      sx={{height: 20, fontSize: 10, fontWeight: 700, backgroundColor: C.gold, color: '#fff'}}/>
            )}
        </Box>
    );
}

export default function BirthdaysPage() {
    const {enqueueSnackbar} = useSnackbar();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.BIRTHDAYS);
            setItems(normalizeList(res.data));
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    const departments = useMemo(() => {
        const set = new Set();
        items.forEach((b) => b.department_name && set.add(b.department_name));
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'az'));
    }, [items]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((b) => {
            if (department !== 'all' && b.department_name !== department) return false;
            if (!q) return true;
            return (b.name || '').toLowerCase().includes(q)
                || (b.role_name || '').toLowerCase().includes(q)
                || (b.department_name || '').toLowerCase().includes(q);
        });
    }, [items, search, department]);

    const today = filtered.filter((b) => b.is_today);

    /** Ayın günü üzrə qruplaşdırma - keçmiş və qarşıdan gələn günlər ayrılır. */
    const groups = useMemo(() => {
        const todayDay = new Date().getDate();
        const map = new Map();
        filtered.forEach((b) => {
            const d = toDate(b.birth_date);
            const day = d ? d.getDate() : 0;
            if (!map.has(day)) map.set(day, []);
            map.get(day).push(b);
        });
        return Array.from(map.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([day, people]) => ({
                day,
                people,
                state: day === todayDay ? 'today' : (day < todayDay ? 'past' : 'upcoming'),
            }));
    }, [filtered]);

    const upcomingCount = groups.filter((g) => g.state === 'upcoming').reduce((s, g) => s + g.people.length, 0);

    return (
        <Box sx={pageWrapSx}>
            {/* Xülasə */}
            <Grid container spacing={2} sx={{mb: 3}}>
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        ...panelSx, p: 2.5, height: '100%',
                        borderColor: today.length ? C.gold : C.line,
                        backgroundColor: today.length ? C.goldTint : C.surface,
                    }}>
                        <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>Bu gün ad günü</Typography>
                        <Typography sx={{fontSize: 30, fontWeight: 700, color: today.length ? C.goldDeep : C.ink, lineHeight: 1.2}}>
                            {today.length}
                        </Typography>
                        <Typography sx={{fontSize: 12.5, color: C.inkMuted, mt: 0.5}}>
                            {today.length ? today.map((t) => t.name).join(', ') : 'Bu gün ad günü olan əməkdaş yoxdur.'}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} md={4}>
                    <Box sx={{...panelSx, p: 2.5, height: '100%'}}>
                        <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>Ay ərzində</Typography>
                        <Typography sx={{fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1.2}}>
                            {items.length}
                        </Typography>
                        <Typography sx={{fontSize: 12.5, color: C.inkMuted, mt: 0.5}}>əməkdaşın ad günü var</Typography>
                    </Box>
                </Grid>
                <Grid item xs={6} md={4}>
                    <Box sx={{...panelSx, p: 2.5, height: '100%'}}>
                        <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>Qarşıdan gələn</Typography>
                        <Typography sx={{fontSize: 30, fontWeight: 700, color: C.ink, lineHeight: 1.2}}>
                            {upcomingCount}
                        </Typography>
                        <Typography sx={{fontSize: 12.5, color: C.inkMuted, mt: 0.5}}>ayın qalan günlərində</Typography>
                    </Box>
                </Grid>
            </Grid>

            {/* Filtrlər */}
            <Box sx={{...panelSx, p: 2, mb: 3, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap'}}>
                <TextField
                    size="small" placeholder="Ad, vəzifə və ya şöbə üzrə axtar" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{...fieldSx, flex: 1, minWidth: 240}}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{fontSize: 18, color: C.inkFaint}}/>
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField select size="small" label="Şöbə" value={department}
                           onChange={(e) => setDepartment(e.target.value)} sx={{...fieldSx, minWidth: 200}}>
                    <MenuItem value="all">Bütün şöbələr</MenuItem>
                    {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
                <Button component={Link} href="/elanlar" sx={{...softButtonSx, py: 1}}>
                    Elanlar lövhəsi
                </Button>
            </Box>

            {loading ? (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                    {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={120}/>)}
                </Box>
            ) : filtered.length === 0 ? (
                <Box sx={panelSx}>
                    <EmptyState
                        icon={<CakeOutlinedIcon sx={{fontSize: 34}}/>}
                        title={search || department !== 'all' ? 'Axtarışa uyğun əməkdaş yoxdur' : 'Bu ay ad günü olan əməkdaş yoxdur'}
                        hint={search || department !== 'all' ? 'Filtrləri dəyişib yenidən yoxlayın.' : 'Növbəti ayın siyahısı ayın əvvəlində görünəcək.'}
                    />
                </Box>
            ) : (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                    {groups.map((g) => (
                        <Box key={g.day} sx={{display: 'flex', gap: 2}}>
                            {/* Gün sütunu */}
                            <Box sx={{width: 64, flexShrink: 0, textAlign: 'center'}}>
                                <Box sx={{
                                    borderRadius: '10px', py: 1,
                                    border: `1px solid ${g.state === 'today' ? C.gold : C.line}`,
                                    backgroundColor: g.state === 'today' ? C.gold : C.surface,
                                    color: g.state === 'today' ? '#fff' : C.ink,
                                    opacity: g.state === 'past' ? 0.55 : 1,
                                }}>
                                    <Typography sx={{fontSize: 20, fontWeight: 700, lineHeight: 1}}>
                                        {String(g.day).padStart(2, '0')}
                                    </Typography>
                                    <Typography sx={{fontSize: 10, opacity: 0.75, mt: 0.3}}>
                                        {g.people.length} nəfər
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{
                                ...panelSx, flex: 1, minWidth: 0, overflow: 'hidden',
                                borderColor: g.state === 'today' ? C.gold : C.line,
                            }}>
                                <Box sx={{px: 2, py: 1.25, backgroundColor: C.surfaceRaised}}>
                                    <Typography sx={{fontSize: 12.5, fontWeight: 700, color: g.state === 'today' ? C.goldDeep : C.inkMuted}}>
                                        {formatDay(g.people[0]?.birth_date)}
                                        {g.state === 'today' ? ' · bu gün' : ''}
                                        {g.state === 'past' ? ' · keçib' : ''}
                                    </Typography>
                                </Box>
                                {g.people.map((p) => <PersonRow key={p.id} person={p}/>)}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}
