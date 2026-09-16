"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, EmptyState, NewsFormDialog, useCanManageBulletin, dayNumber, formatFull,
    fieldSx, monthShort, normalizeList, pageWrapSx, panelSx, softButtonSx,
} from "./bulletinShared";

const PAGE_SIZE = 9;

function NewsCard({item}) {
    return (
        <Box component={Link} href={`/elanlar/xeberler/${item.id}`}
             sx={{
                 ...panelSx, display: 'flex', flexDirection: 'column', height: '100%',
                 overflow: 'hidden', textDecoration: 'none',
                 transition: 'border-color .15s ease',
                 '&:hover': {borderColor: C.gold},
                 '&:hover .news-card-title': {color: C.goldDeep},
             }}>
            <Box sx={{position: 'relative', height: 164, backgroundColor: C.surfaceDeep, flexShrink: 0}}>
                {item.image_url ? (
                    <Box component="img" src={item.image_url} alt={item.title}
                         sx={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}/>
                ) : (
                    <Box sx={{
                        width: '100%', height: '100%', backgroundColor: C.goldTint,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <NewspaperOutlinedIcon sx={{fontSize: 30, color: C.gold}}/>
                    </Box>
                )}
                <Box sx={{
                    position: 'absolute', left: 12, bottom: -18, width: 46, height: 46,
                    borderRadius: '10px', backgroundColor: C.surface, border: `1px solid ${C.line}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Typography sx={{fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1}}>
                        {dayNumber(item.published_at)}
                    </Typography>
                    <Typography sx={{fontSize: 9.5, color: C.inkFaint}}>{monthShort(item.published_at)}</Typography>
                </Box>
            </Box>
            <Box sx={{p: 2, pt: 3.25, flex: 1, display: 'flex', flexDirection: 'column'}}>
                <Typography className="news-card-title" sx={{
                    fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.35, transition: 'color .15s ease',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {item.title}
                </Typography>
                {item.summary && (
                    <Typography sx={{
                        fontSize: 12.5, color: C.inkMuted, mt: 0.75, lineHeight: 1.5, flex: 1,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {item.summary}
                    </Typography>
                )}
                <Typography sx={{fontSize: 11, color: C.inkFaint, mt: 1.5}}>
                    {formatFull(item.published_at)}{item.organization_name ? ` · ${item.organization_name}` : ''}
                </Typography>
            </Box>
        </Box>
    );
}

export default function NewsListPage() {
    const {enqueueSnackbar} = useSnackbar();
    const {canManage} = useCanManageBulletin();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [year, setYear] = useState('all');
    const [order, setOrder] = useState('new');
    const [visible, setVisible] = useState(PAGE_SIZE);
    const [formOpen, setFormOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.NEWS);
            setItems(normalizeList(res.data));
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    const years = useMemo(() => {
        const set = new Set();
        items.forEach((n) => {
            const d = n.published_at ? new Date(n.published_at) : null;
            if (d && !Number.isNaN(d.getTime())) set.add(d.getFullYear());
        });
        return Array.from(set).sort((a, b) => b - a);
    }, [items]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = items.filter((n) => {
            const matchesText = !q
                || (n.title || '').toLowerCase().includes(q)
                || (n.summary || '').toLowerCase().includes(q)
                || (n.body || '').toLowerCase().includes(q);
            if (!matchesText) return false;
            if (year === 'all') return true;
            const d = n.published_at ? new Date(n.published_at) : null;
            return d && !Number.isNaN(d.getTime()) && String(d.getFullYear()) === String(year);
        });
        list = list.sort((a, b) => {
            const da = new Date(a.published_at || 0).getTime();
            const db = new Date(b.published_at || 0).getTime();
            return order === 'new' ? db - da : da - db;
        });
        return list;
    }, [items, search, year, order]);

    useEffect(() => { setVisible(PAGE_SIZE); }, [search, year, order]);

    return (
        <Box sx={pageWrapSx}>
            {/* Filtr paneli */}
            <Box sx={{
                ...panelSx, p: 2, mb: 3, display: 'flex', gap: 1.5,
                alignItems: 'center', flexWrap: 'wrap',
            }}>
                <TextField
                    size="small" placeholder="Xəbərlərdə axtar" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{...fieldSx, flex: 1, minWidth: 220}}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{fontSize: 18, color: C.inkFaint}}/>
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField select size="small" label="İl" value={year} onChange={(e) => setYear(e.target.value)}
                           sx={{...fieldSx, width: 130}}>
                    <MenuItem value="all">Bütün illər</MenuItem>
                    {years.map((y) => <MenuItem key={y} value={String(y)}>{y}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Sıralama" value={order} onChange={(e) => setOrder(e.target.value)}
                           sx={{...fieldSx, width: 160}}>
                    <MenuItem value="new">Əvvəlcə yenilər</MenuItem>
                    <MenuItem value="old">Əvvəlcə köhnələr</MenuItem>
                </TextField>
                {canManage && (
                    <Button startIcon={<AddIcon/>} onClick={() => setFormOpen(true)} sx={{...softButtonSx, py: 1}}>
                        Yeni xəbər
                    </Button>
                )}
            </Box>

            <Typography sx={{fontSize: 12.5, color: C.inkMuted, mb: 1.5}}>
                {loading ? 'Yüklənir...' : `${filtered.length} xəbər tapıldı`}
            </Typography>

            {loading ? (
                <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rounded" height={300}/>
                        </Grid>
                    ))}
                </Grid>
            ) : filtered.length === 0 ? (
                <Box sx={panelSx}>
                    <EmptyState
                        icon={<NewspaperOutlinedIcon sx={{fontSize: 34}}/>}
                        title={search || year !== 'all' ? 'Axtarışa uyğun xəbər yoxdur' : 'Hələ xəbər dərc edilməyib'}
                        hint={search || year !== 'all' ? 'Filtrləri dəyişib yenidən yoxlayın.' : 'Dərc edilən xəbərlər burada toplanacaq.'}
                    />
                </Box>
            ) : (
                <>
                    <Grid container spacing={2} alignItems="stretch">
                        {filtered.slice(0, visible).map((n) => (
                            <Grid item xs={12} sm={6} md={4} key={n.id}>
                                <NewsCard item={n}/>
                            </Grid>
                        ))}
                    </Grid>
                    {visible < filtered.length && (
                        <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
                            <Button onClick={() => setVisible((v) => v + PAGE_SIZE)}
                                    sx={{...softButtonSx, px: 3, py: 1}}>
                                Daha çox göstər ({filtered.length - visible})
                            </Button>
                        </Box>
                    )}
                </>
            )}

            <NewsFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={load}/>
        </Box>
    );
}