"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, CATEGORIES, CATEGORY_MAP, CircularFormDialog, EmptyState, canManageBulletin,
    dayNumber, fieldSx, formatFull, monthShort, normalizeList, pageWrapSx, panelSx, softButtonSx,
} from "./bulletinShared";

function CircularRow({item, canManage, onDelete, deleting}) {
    const cat = CATEGORY_MAP[item.category];
    return (
        <Box sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1.75, p: 2,
            borderTop: `1px solid ${C.line}`,
            transition: 'background-color .15s ease',
            '&:hover': {backgroundColor: C.surfaceRaised},
            '&:hover .circ-row-title': {color: C.goldDeep},
        }}>
            <Box sx={{
                width: 46, flexShrink: 0, textAlign: 'center',
                border: `1px solid ${C.line}`, borderRadius: '8px', py: 0.75,
                backgroundColor: C.surfaceRaised,
            }}>
                <Typography sx={{fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1}}>
                    {dayNumber(item.document_date)}
                </Typography>
                <Typography sx={{fontSize: 9.5, color: C.inkFaint}}>{monthShort(item.document_date)}</Typography>
            </Box>

            <Box sx={{minWidth: 0, flex: 1}}>
                <Box component={Link} href={`/elanlar/senedler/${item.id}`} sx={{textDecoration: 'none'}}>
                    <Typography className="circ-row-title" sx={{
                        fontSize: 14.5, fontWeight: 600, color: C.ink, lineHeight: 1.4, transition: 'color .15s ease',
                    }}>
                        {item.title}
                    </Typography>
                </Box>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25, mt: 0.6, flexWrap: 'wrap'}}>
                    {cat && (
                        <Chip label={cat.label} size="small"
                              sx={{height: 19, fontSize: 10, fontWeight: 700, backgroundColor: C.goldTint, color: C.goldDeep}}/>
                    )}
                    {item.number && (
                        <Typography sx={{fontSize: 11.5, color: C.inkMuted}}>№ {item.number}</Typography>
                    )}
                    {item.document_date && (
                        <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>{formatFull(item.document_date)}</Typography>
                    )}
                    <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>
                        {item.organization_name || 'Bütün qurumlar'}
                    </Typography>
                    {!item.file_url && (
                        <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>Fayl əlavə edilməyib</Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{display: 'flex', gap: 0.25, flexShrink: 0}}>
                {item.file_url && (
                    <Tooltip title="Faylı yüklə">
                        <IconButton size="small" component="a" href={item.file_url} target="_blank" rel="noopener"
                                    sx={{color: C.inkMuted}}>
                            <DownloadOutlinedIcon sx={{fontSize: 18}}/>
                        </IconButton>
                    </Tooltip>
                )}
                {canManage && (
                    <Tooltip title="Sil">
                        <IconButton size="small" onClick={() => onDelete(item)} disabled={deleting}
                                    sx={{color: C.danger}}>
                            {deleting ? <CircularProgress size={15}/> : <DeleteOutlineIcon sx={{fontSize: 18}}/>}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
}

export default function CircularsListPage({initialCategory}) {
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const canManage = canManageBulletin(user);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState([]);
    const [category, setCategory] = useState(
        CATEGORY_MAP[initialCategory] ? initialCategory : 'all'
    );
    const [search, setSearch] = useState('');
    const [year, setYear] = useState('all');
    const [order, setOrder] = useState('new');
    const [dialogCategory, setDialogCategory] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.CIRCULARS);
            setItems(normalizeList(res.data));
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!isRoot) return;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATION.LIST);
                setOrganizations(normalizeList(res.data));
            } catch (e) {
                // qurum siyahısı kritik deyil
            }
        })();
    }, [isRoot]);

    const years = useMemo(() => {
        const set = new Set();
        items.forEach((c) => {
            const d = c.document_date ? new Date(c.document_date) : null;
            if (d && !Number.isNaN(d.getTime())) set.add(d.getFullYear());
        });
        return Array.from(set).sort((a, b) => b - a);
    }, [items]);

    const counts = useMemo(() => {
        const res = {all: items.length};
        CATEGORIES.forEach((c) => {
            res[c.value] = items.filter((i) => i.category === c.value).length;
        });
        return res;
    }, [items]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items
            .filter((c) => {
                if (category !== 'all' && c.category !== category) return false;
                if (q && !((c.title || '').toLowerCase().includes(q) || String(c.number || '').toLowerCase().includes(q))) return false;
                if (year === 'all') return true;
                const d = c.document_date ? new Date(c.document_date) : null;
                return d && !Number.isNaN(d.getTime()) && String(d.getFullYear()) === String(year);
            })
            .sort((a, b) => {
                const da = new Date(a.document_date || 0).getTime();
                const db = new Date(b.document_date || 0).getTime();
                return order === 'new' ? db - da : da - db;
            });
    }, [items, category, search, year, order]);

    async function handleDelete(item) {
        setDeletingId(item.id);
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.BULLETIN.CIRCULAR_DETAIL(item.id));
            enqueueSnackbar('Sənəd silindi.', {variant: 'success'});
            load();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setDeletingId(null);
        }
    }

    const chips = [{value: 'all', label: 'Hamısı'}, ...CATEGORIES.map((c) => ({value: c.value, label: c.plural}))];

    return (
        <Box sx={pageWrapSx}>
            {/* Kateqoriya seçimi */}
            <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2}}>
                {chips.map((c) => {
                    const active = category === c.value;
                    return (
                        <Box key={c.value} onClick={() => setCategory(c.value)}
                             sx={{
                                 display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                                 px: 1.75, py: 0.9, borderRadius: '999px',
                                 border: `1px solid ${active ? C.gold : C.line}`,
                                 backgroundColor: active ? C.gold : C.surface,
                                 color: active ? '#fff' : C.inkMuted,
                                 transition: 'all .15s ease',
                                 '&:hover': {borderColor: active ? C.gold : C.lineStrong},
                             }}>
                            <Typography sx={{fontSize: 12.5, fontWeight: 600}}>{c.label}</Typography>
                            <Typography sx={{fontSize: 11, opacity: 0.8}}>{counts[c.value] ?? 0}</Typography>
                        </Box>
                    );
                })}
            </Box>

            {/* Filtrlər */}
            <Box sx={{...panelSx, p: 2, mb: 3, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap'}}>
                <TextField
                    size="small" placeholder="Başlıq və ya nömrə üzrə axtar" value={search}
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
                    <Button startIcon={<AddIcon/>}
                            onClick={() => setDialogCategory(category === 'all' ? 'ferman' : category)}
                            sx={{...softButtonSx, py: 1}}>
                        Yeni sənəd
                    </Button>
                )}
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Box sx={panelSx}>
                        <Box sx={{px: 2, py: 1.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                            <Typography sx={{fontSize: 14.5, fontWeight: 700, color: C.ink}}>
                                {category === 'all' ? 'Bütün sənədlər' : CATEGORY_MAP[category].plural}
                            </Typography>
                            <Typography sx={{fontSize: 12, color: C.inkFaint}}>
                                {loading ? 'Yüklənir...' : `${filtered.length} nəticə`}
                            </Typography>
                        </Box>

                        {loading ? (
                            <Box sx={{p: 2, display: 'flex', flexDirection: 'column', gap: 1}}>
                                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={64}/>)}
                            </Box>
                        ) : filtered.length === 0 ? (
                            <EmptyState
                                icon={<FolderOutlinedIcon sx={{fontSize: 34}}/>}
                                title="Bu filtrlərə uyğun sənəd yoxdur"
                                hint="Kateqoriyanı və ya axtarış sözünü dəyişin."
                            />
                        ) : filtered.map((item) => (
                            <CircularRow key={item.id} item={item} canManage={canManage}
                                         onDelete={handleDelete} deleting={deletingId === item.id}/>
                        ))}
                    </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Box sx={{...panelSx, p: 2.5, position: {md: 'sticky'}, top: {md: 24}}}>
                        <Typography sx={{fontSize: 14.5, fontWeight: 700, color: C.ink, mb: 1.5}}>
                            Bölmələr
                        </Typography>
                        {CATEGORIES.map((c, idx) => (
                            <Box key={c.value} onClick={() => setCategory(c.value)}
                                 sx={{
                                     display: 'flex', gap: 1.25, alignItems: 'flex-start', py: 1.5, cursor: 'pointer',
                                     borderTop: idx === 0 ? 'none' : `1px solid ${C.line}`,
                                 }}>
                                <Box sx={{
                                    width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                                    backgroundColor: C.goldTint, color: C.gold,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {c.icon}
                                </Box>
                                <Box sx={{minWidth: 0, flex: 1}}>
                                    <Typography sx={{fontSize: 13.5, fontWeight: 600, color: C.ink}}>
                                        {c.plural} · {counts[c.value] ?? 0}
                                    </Typography>
                                    <Typography sx={{fontSize: 11.5, color: C.inkFaint, lineHeight: 1.4, mt: 0.2}}>
                                        {c.hint}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                        <Button fullWidth component={Link} href="/elanlar" sx={{...softButtonSx, mt: 2}}>
                            Elanlar lövhəsi
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <CircularFormDialog
                open={!!dialogCategory}
                onClose={() => setDialogCategory(null)}
                onSaved={load}
                defaultCategory={dialogCategory || 'ferman'}
                isRoot={isRoot}
                organizations={organizations}
            />
        </Box>
    );
}
