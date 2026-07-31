"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";

const C = {
    bg: '#fff',
    surface: '#FFFFFF',
    surfaceRaised: '#FBFAF6',
    line: '#E4E1D8',
    lineStrong: '#D0CCC0',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    gold: '#9C7A2E',
    goldMuted: 'rgba(156,122,46,0.35)',
    goldWash: 'rgba(156,122,46,0.08)',
};

const ACTION_META = {
    login: {label: 'Daxil oldu', fg: '#2F6B4F', bg: 'rgba(47,107,79,0.08)', ring: 'rgba(47,107,79,0.3)'},
    logout: {label: 'Çıxış etdi', fg: '#6B4E8C', bg: 'rgba(107,78,140,0.08)', ring: 'rgba(107,78,140,0.3)'},
    viewed: {label: 'Baxdı', fg: '#8A7A2E', bg: 'rgba(138,122,46,0.08)', ring: 'rgba(138,122,46,0.3)'},
    created: {label: 'Yaratdı', fg: '#2F6B4F', bg: 'rgba(47,107,79,0.08)', ring: 'rgba(47,107,79,0.3)'},
    updated: {label: 'Dəyişiklik etdi', fg: '#2B5E8C', bg: 'rgba(43,94,140,0.08)', ring: 'rgba(43,94,140,0.3)'},
    deleted: {label: 'Sildi', fg: '#A23B3B', bg: 'rgba(162,59,59,0.08)', ring: 'rgba(162,59,59,0.3)'},
    exported: {label: 'İxrac etdi', fg: '#6B4E8C', bg: 'rgba(107,78,140,0.08)', ring: 'rgba(107,78,140,0.3)'},
    other: {label: 'Digər', fg: C.inkMuted, bg: C.surfaceRaised, ring: C.line},
};

const ACTION_FILTERS = [
    {value: '', label: 'Hamısı'},
    {value: 'login', label: 'Daxil oldu'},
    {value: 'logout', label: 'Çıxış etdi'},
    {value: 'viewed', label: 'Baxdı'},
    {value: 'created', label: 'Yaratdı'},
    {value: 'updated', label: 'Dəyişiklik etdi'},
    {value: 'deleted', label: 'Sildi'},
    {value: 'exported', label: 'İxrac etdi'},
    {value: 'other', label: 'Digər'},
];

function formatValue(v) {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

function initialsOf(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    return (parts[0]?.[0] || '').concat(parts[1]?.[0] || '').toUpperCase() || '?';
}

function DetailDialog({row, onClose}) {
    if (!row) return null;
    const meta = ACTION_META[row.action_type] || {label: row.action_type, fg: C.inkMuted, bg: C.surfaceRaised, ring: C.line};
    const userName = row.user?.name || row.user?.username || row.user_username_snapshot || 'Bilinməyən istifadəçi';

    return (
        <Dialog
            open onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{sx: {backgroundColor: C.surface, backgroundImage: 'none', border: `1px solid ${C.line}`, borderRadius: '4px'}}}
        >
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`}}>
                <Box>
                    <Typography sx={{fontSize: 11, letterSpacing: '0.08em', color: C.gold, textTransform: 'uppercase', mb: 0.5}}>
                        {row.module_title || row.module_code || 'Ümumi'}
                    </Typography>
                    <Typography sx={{fontSize: 20, color: C.ink, fontWeight: 500, lineHeight: 1.3}}>
                        {row.description || '—'}
                    </Typography>
                    <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1, px: 1, py: 0.4, borderRadius: '3px', backgroundColor: meta.bg, border: `1px solid ${meta.ring}`}}>
                        <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.fg}}/>
                        <Typography sx={{fontSize: 12, color: meta.fg, fontWeight: 500}}>{meta.label}</Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5}}>
                <Typography sx={{fontSize: 12, color: C.inkFaint, mb: 2}}>
                    {userName}
                    {'  ·  '}
                    {row.timestamp ? new Date(row.timestamp).toLocaleString('az-AZ') : '—'}
                </Typography>

                <Box sx={{border: `1px solid ${C.line}`, borderRadius: '4px', overflow: 'hidden', mb: row.changes ? 2 : 0}}>
                    {[
                        ['Metod', row.request_method],
                        ['URL', row.request_path],
                        ['Status kodu', row.status_code],
                        ['IP ünvanı', row.ip_address],
                        ['Cihaz / brauzer', row.user_agent],
                    ].map(([label, value], i) => (
                        <Box key={label} sx={{display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, gap: {xs: 0.25, sm: 2}, px: 2, py: 1, borderTop: i === 0 ? 'none' : `1px solid ${C.line}`}}>
                            <Typography sx={{fontSize: 12, color: C.inkFaint, minWidth: {xs: 'auto', sm: 140}, fontWeight: 500}}>{label}</Typography>
                            <Typography sx={{fontSize: 13, color: C.ink, wordBreak: 'break-word'}}>{formatValue(value)}</Typography>
                        </Box>
                    ))}
                </Box>

                {row.changes && (
                    <Box>
                        <Typography sx={{fontSize: 12, color: C.inkFaint, fontWeight: 500, mb: 1}}>Göndərilən məlumat</Typography>
                        <Box sx={{border: `1px solid ${C.line}`, borderRadius: '4px', p: 1.5, backgroundColor: C.surfaceRaised}}>
                            <Typography component="pre" sx={{fontSize: 12, color: C.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word', m: 0}}>
                                {JSON.stringify(row.changes, null, 2)}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end'}}>
                <Button onClick={onClose} sx={{color: C.inkMuted, '&:hover': {backgroundColor: 'rgba(0,0,0,0.035)'}}}>
                    Bağla
                </Button>
            </Box>
        </Dialog>
    );
}

const gridSx = {
    border: `1px solid ${C.line}`,
    borderRadius: '4px',
    backgroundColor: C.surface,
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.lineStrong}`,
    },
    '& .MuiDataGrid-columnHeaderTitle': {
        fontSize: 11,
        letterSpacing: '0.05em',
        color: C.inkFaint,
        textTransform: 'uppercase',
        fontWeight: 500,
    },
    '& .MuiDataGrid-cell': {
        borderBottom: `1px solid ${C.line}`,
        fontSize: 13.5,
        color: C.ink,
        display: 'flex',
        alignItems: 'center',
    },
    '& .MuiDataGrid-row:hover': {
        backgroundColor: 'rgba(0,0,0,0.015)',
    },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
        outline: 'none',
    },
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
        outline: 'none',
    },
    '& .MuiDataGrid-footerContainer': {
        borderTop: `1px solid ${C.line}`,
    },
    '& .MuiTablePagination-root': {
        color: C.inkMuted,
    },
};

export default function ActivityLogTable() {
    const {enqueueSnackbar} = useSnackbar();

    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [ordering, setOrdering] = useState('-timestamp');

    const [paginationModel, setPaginationModel] = useState({page: 0, pageSize: 20});
    const [detailRow, setDetailRow] = useState(null);

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (actionFilter) params.set('action_type', actionFilter);
        if (ordering) params.set('ordering', ordering);
        params.set('page', String(paginationModel.page + 1));
        params.set('page_size', String(paginationModel.pageSize));
        return params.toString();
    }, [search, actionFilter, ordering, paginationModel]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ACTIVITY_LOGS.LIST}?${buildQuery()}`);
            const data = res.data;
            if (Array.isArray(data)) {
                setRows(data);
                setCount(data.length);
            } else {
                setRows(data.results || []);
                setCount(data.count ?? (data.results || []).length);
            }
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [buildQuery, enqueueSnackbar]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        const t = setTimeout(() => setPaginationModel((p) => ({...p, page: 0})), 300);
        return () => clearTimeout(t);
    }, [search]);

    const columns = useMemo(() => ([
        {
            field: 'timestamp', headerName: 'Tarix/Vaxt', width: 170,
            renderCell: (p) => (
                <Typography sx={{fontSize: 12, color: C.inkFaint}}>
                    {p.value ? new Date(p.value).toLocaleString('az-AZ') : '—'}
                </Typography>
            ),
        },
        {
            field: 'user', headerName: 'İstifadəçi', width: 180, sortable: false,
            renderCell: (p) => {
                const userName = p.row.user?.name || p.row.user?.username || p.row.user_username_snapshot || '—';
                return (
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden'}}>
                        <Box sx={{
                            width: 18, height: 18, borderRadius: '50%', backgroundColor: C.goldWash,
                            border: `1px solid ${C.goldMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 9, color: C.gold, fontWeight: 600, flexShrink: 0,
                        }}>
                            {initialsOf(userName)}
                        </Box>
                        <Typography sx={{fontSize: 12.5, color: C.inkFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            {userName}
                        </Typography>
                    </Box>
                );
            },
        },
        {
            field: 'action_type', headerName: 'Əməliyyat', width: 160,
            renderCell: (p) => {
                const meta = ACTION_META[p.value] || {label: p.value, fg: C.inkMuted, bg: C.surfaceRaised, ring: C.line};
                return (
                    <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: '3px', backgroundColor: meta.bg, border: `1px solid ${meta.ring}`}}>
                        <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.fg, flexShrink: 0}}/>
                        <Typography sx={{fontSize: 11, color: meta.fg, fontWeight: 500, whiteSpace: 'nowrap'}}>{meta.label}</Typography>
                    </Box>
                );
            },
        },
        {
            field: 'module_title', headerName: 'Modul', width: 170, sortable: false,
            renderCell: (p) => (
                <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>{p.value || p.row.module_code || '—'}</Typography>
            ),
        },
        {
            field: 'description', headerName: 'Təsvir', flex: 1.6, minWidth: 220, sortable: false,
            renderCell: (p) => (
                <Typography sx={{fontSize: 13, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {p.value || '—'}
                </Typography>
            ),
        },
        {
            field: 'ip_address', headerName: 'IP', width: 130, sortable: false,
            renderCell: (p) => <Typography sx={{fontSize: 12, color: C.inkFaint}}>{p.value || '—'}</Typography>,
        },
        {
            field: 'actions', headerName: '', width: 60, sortable: false, filterable: false, disableColumnMenu: true,
            renderCell: (p) => (
                <IconButton size="small" onClick={() => setDetailRow(p.row)} sx={{color: C.inkFaint}}>
                    <VisibilityOutlinedIcon sx={{fontSize: 17}}/>
                </IconButton>
            ),
        },
    ]), []);

    function handleSortModelChange(model) {
        if (!model || model.length === 0) {
            setOrdering('-timestamp');
            return;
        }
        const {field, sort} = model[0];
        if (field === 'timestamp') {
            setOrdering(sort === 'desc' ? '-timestamp' : 'timestamp');
        }
    }

    return (
        <Box sx={{p: {xs: 2, sm: 3}, backgroundColor: C.bg}}>
            <Typography sx={{fontSize: {xs: 20, sm: 24}, fontWeight: 700, color: C.ink, mb: 0.5}}>
                Loqlar
            </Typography>
            <Typography sx={{fontSize: 13, color: C.inkMuted, mb: 3}}>
                Sistemdə baş vermiş bütün fəaliyyətlərin tarixçəsi — giriş/çıxış, baxışlar və dəyişikliklər.
            </Typography>

            <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2}}>
                <TextField
                    size="small" placeholder="Axtar..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>,
                        sx: {color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px', '& .MuiOutlinedInput-notchedOutline': {borderColor: C.line}},
                    }}
                    sx={{minWidth: 280}}
                />
                <TextField
                    select size="small" value={actionFilter}
                    onChange={(e) => {setActionFilter(e.target.value); setPaginationModel((p) => ({...p, page: 0}));}}
                    SelectProps={{sx: {color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px'}}}
                    sx={{minWidth: 190}}
                >
                    {ACTION_FILTERS.map((o) => (
                        <MenuItem key={o.value} value={o.value} sx={{color: C.ink, fontSize: 13}}>{o.label}</MenuItem>
                    ))}
                </TextField>
                <Button
                    size="small"
                    startIcon={<SwapVertIcon sx={{fontSize: 16}}/>}
                    onClick={() => setOrdering((o) => (o === '-timestamp' ? 'timestamp' : '-timestamp'))}
                    sx={{color: C.inkMuted, fontSize: 12, textTransform: 'none', '&:hover': {color: C.ink, backgroundColor: 'rgba(0,0,0,0.035)'}}}
                >
                    {ordering === '-timestamp' ? 'Yeni əvvəl' : 'Köhnə əvvəl'}
                </Button>
            </Box>

            <Box sx={{height: {xs: 480, sm: 560, md: 640}, width: '100%'}}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading}
                    rowCount={count}
                    paginationMode="server"
                    sortingMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onSortModelChange={handleSortModelChange}
                    onRowClick={(params) => setDetailRow(params.row)}
                    pageSizeOptions={[20, 50, 100]}
                    disableRowSelectionOnClick
                    disableColumnFilter
                    localeText={{noRowsLabel: 'Heç bir loq qeydi tapılmadı'}}
                    sx={gridSx}
                />
            </Box>

            <DetailDialog row={detailRow} onClose={() => setDetailRow(null)}/>
        </Box>
    );
}