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
import GlobalStyles from '@mui/material/GlobalStyles';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ViewTimelineOutlinedIcon from '@mui/icons-material/ViewTimelineOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';


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
    created: {label: 'Yaradıldı', fg: '#2F6B4F', bg: 'rgba(47,107,79,0.08)', ring: 'rgba(47,107,79,0.3)'},
    updated: {label: 'Redaktə edildi', fg: '#2B5E8C', bg: 'rgba(43,94,140,0.08)', ring: 'rgba(43,94,140,0.3)'},
    deleted: {label: 'Silindi', fg: '#A23B3B', bg: 'rgba(162,59,59,0.08)', ring: 'rgba(162,59,59,0.3)'},
    exported: {label: 'İxrac edildi', fg: '#6B4E8C', bg: 'rgba(107,78,140,0.08)', ring: 'rgba(107,78,140,0.3)'},
    viewed: {label: 'Baxıldı', fg: '#8A7A2E', bg: 'rgba(138,122,46,0.08)', ring: 'rgba(138,122,46,0.3)'},
};

const ACTION_FILTERS = [
    {value: '', label: 'Hamısı'},
    {value: 'created', label: 'Yaradıldı'},
    {value: 'updated', label: 'Redaktə edildi'},
    {value: 'deleted', label: 'Silindi'},
    {value: 'exported', label: 'İxrac edildi'},
    {value: 'viewed', label: 'Baxıldı'},
];

const FIELD_LABELS = {
    designation: 'Təyinat',
    legal_basis: 'Hüquqi əsas',
    international_framework: 'Beynəlxalq çərçivə / istinad',
    national_legal_reference: 'Milli hüquqi istinad',
    asset_value: 'Aktivin dəyəri (H)',
    probability: 'Ehtimal (M)',
    impact: 'Təsir (N)',
    treatment_option: 'Emal variantı',
    residual_risk: 'Qalıq risk',
    update_frequency: 'Yenilənmə tezliyi',
    incident_notification_notes: 'İnsident qeydləri',
    standard_references: 'Standartlara istinad',
};

function formatValue(v) {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

function normalizeChanges(row) {
    if (row.changes && typeof row.changes === 'object') {
        return Object.entries(row.changes).map(([key, val]) => ({
            key,
            label: val.label || FIELD_LABELS[key] || key,
            old: val.old,
            new: val.new,
        }));
    }
    if (row.field_name) {
        return [{
            key: row.field_name,
            label: FIELD_LABELS[row.field_name] || row.field_name,
            old: row.old_value,
            new: row.new_value,
        }];
    }
    return [];
}

function initialsOf(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    return (parts[0]?.[0] || '').concat(parts[1]?.[0] || '').toUpperCase() || '?';
}

function summaryText(row) {
    if (row.action_type === 'created') return 'Yeni qeyd yaradıldı';
    if (row.action_type === 'deleted') return 'Qeyd silindi';
    if (row.action_type === 'viewed') return row.risk_designation || 'Baxıldı';
    if (row.action_type === 'exported') {
        const n = row.changes?.row_count?.new ?? '—';
        return `Excel-ə ixrac edildi — ${n} sətir`;
    }
    const changes = normalizeChanges(row);
    if (changes.length === 0) return '—';
    const preview = changes.slice(0, 2).map((c) => c.label).join(', ');
    const extra = changes.length > 2 ? ` +${changes.length - 2}` : '';
    return `${changes.length} sahə dəyişdi — ${preview}${extra}`;
}

function DetailDialog({row, onClose}) {
    if (!row) return null;
    const changes = normalizeChanges(row);
    const meta = ACTION_META[row.action_type] || {label: row.action_type, fg: C.inkMuted, bg: C.surfaceRaised, ring: C.line};

    return (
        <Dialog
            open onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{sx: {backgroundColor: C.surface, backgroundImage: 'none', border: `1px solid ${C.line}`, borderRadius: '4px'}}}
        >
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`}}>
                <Box>
                    <Typography sx={{ fontSize: 11, letterSpacing: '0.08em', color: C.gold, textTransform: 'uppercase', mb: 0.5}}>
                        {row.id || '—'}
                    </Typography>
                    <Typography sx={{fontSize: 20, color: C.ink, fontWeight: 500, lineHeight: 1.3}}>
                        {row.risk_designation || 'adsız qeyd'}
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
                <Typography sx={{ fontSize: 12, color: C.inkFaint, mb: 2}}>
                    {row.user?.name || row.user?.username || row.user_username_snapshot || 'Bilinməyən istifadəçi'}
                    {'  ·  '}
                    {row.timestamp ? new Date(row.timestamp).toLocaleString('az-AZ') : '—'}
                </Typography>

                {row.action_type === 'updated' && changes.length > 0 && (
                    <Box sx={{border: `1px solid ${C.line}`, borderRadius: '4px', overflow: 'hidden'}}>
                        {changes.map((c, i) => (
                            <Box
                                key={c.key}
                                sx={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
                                    px: 2, py: 1.25,
                                    borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
                                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)',
                                }}
                            >
                                <Box sx={{gridColumn: '1 / -1', fontSize: 12, color: C.inkFaint, fontWeight: 500, mb: 0.5}}>{c.label}</Box>
                                <Typography sx={{ fontSize: 13, color: '#A23B3B', wordBreak: 'break-word'}}>
                                    − {formatValue(c.old)}
                                </Typography>
                                <Typography sx={{ fontSize: 13, color: '#2F6B4F', wordBreak: 'break-word'}}>
                                    + {formatValue(c.new)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                {row.action_type === 'created' && (
                    <Typography sx={{fontSize: 13, color: C.inkMuted}}>
                        Bu risk qeydi sistemdə yaradılıb. Yaradılış anında dəyişiklik tarixçəsi yoxdur.
                    </Typography>
                )}

                {row.action_type === 'exported' && (
                    <Typography sx={{fontSize: 13, color: C.inkMuted}}>
                        {row.changes?.row_count?.new ?? '—'} sətir Excel formatına ixrac edilib.
                    </Typography>
                )}

                {row.action_type === 'deleted' && row.risk_snapshot && (
                    <Box sx={{border: `1px solid ${C.line}`, borderRadius: '4px', overflow: 'hidden'}}>
                        {Object.entries(row.risk_snapshot)
                            .filter(([k]) => !['id', 'created_by', 'updated_by', 'created_at', 'updated_at'].includes(k))
                            .map(([k, v], i) => (
                                <Box key={k} sx={{display: 'flex', gap: 2, px: 2, py: 1, borderTop: i === 0 ? 'none' : `1px solid ${C.line}`}}>
                                    <Typography sx={{fontSize: 12, color: C.inkFaint, minWidth: 160, fontWeight: 500}}>{FIELD_LABELS[k] || k}</Typography>
                                    <Typography sx={{fontSize: 13, color: C.ink, wordBreak: 'break-word'}}>{formatValue(v)}</Typography>
                                </Box>
                            ))}
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

function TimelineEntry({row, isLast, onOpen}) {
    const meta = ACTION_META[row.action_type] || {label: row.action_type, fg: C.inkMuted, bg: C.surfaceRaised, ring: C.line};
    const userName = row.user?.name || row.user?.username || row.user_username_snapshot || 'Bilinməyən';
    const time = row.timestamp ? new Date(row.timestamp).toLocaleTimeString('az-AZ', {hour: '2-digit', minute: '2-digit'}) : '—';

    return (
        <Box sx={{display: 'flex', gap: 2, position: 'relative'}}>
            <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0}}>
                <Box sx={{
                    width: 12, height: 12, borderRadius: '50%', mt: '6px',
                    backgroundColor: meta.bg, border: `2px solid ${meta.fg}`, flexShrink: 0, zIndex: 1,
                }}/>
                {!isLast && <Box sx={{width: '1px', flex: 1, backgroundColor: C.line, mt: '4px'}}/>}
            </Box>

            <Box
                onClick={() => onOpen(row)}
                sx={{
                    flex: 1, mb: 2, pb: 2, cursor: 'pointer',
                    borderBottom: isLast ? 'none' : `1px solid ${C.line}`,
                    transition: 'opacity 0.15s',
                    '&:hover': {opacity: 0.85},
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5}}>
                    <Box sx={{px: 1, py: 0.25, borderRadius: '3px', backgroundColor: meta.bg, border: `1px solid ${meta.ring}`}}>
                        <Typography sx={{fontSize: 11, color: meta.fg, fontWeight: 500, letterSpacing: '0.02em'}}>{meta.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: C.inkFaint}}>
                        {row.risk_id_ref || '—'}
                    </Typography>
                    <Typography sx={{fontSize: 13, color: C.ink, fontWeight: 500}}>
                        {row.risk_designation || '—'}
                    </Typography>
                </Box>

                <Typography sx={{fontSize: 13, color: C.inkMuted, mb: 0.75}}>
                    {summaryText(row)}
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Box sx={{
                        width: 18, height: 18, borderRadius: '50%', backgroundColor: C.goldWash,
                        border: `1px solid ${C.goldMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: C.gold, fontWeight: 600, flexShrink: 0,
                    }}>
                        {initialsOf(userName)}
                    </Box>
                    <Typography sx={{fontSize: 12, color: C.inkFaint}}>{userName}</Typography>
                    <Typography sx={{ fontSize: 12, color: C.inkFaint}}>· {time}</Typography>
                </Box>
            </Box>
        </Box>
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
    '& .MuiDataGrid-cellContent': {
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

export default function RiskLogsPage() {
    const {enqueueSnackbar} = useSnackbar();

    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [ordering, setOrdering] = useState('-timestamp');

    const [paginationModel, setPaginationModel] = useState({page: 0, pageSize: 20});

    const [detailRow, setDetailRow] = useState(null);
    const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'table'

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
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.RISK.LOGS}?${buildQuery()}`);
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

    const AZ_MONTHS = [
        'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
        'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
    ];

    function formatAzDate(d) {
        return `${d.getDate()} ${AZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }

    const groups = useMemo(() => {
        const map = new Map();
        rows.forEach((row) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            const key = d ? formatAzDate(d) : 'Tarix yoxdur';
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(row);
        });
        return Array.from(map.entries());
    }, [rows]);

    const columns = useMemo(() => [
        {field: 'id', headerName: 'ID', width: 80, renderCell: (p) => (
                <Typography sx={{fontSize: 12, color: C.inkFaint}}>{p.value ?? '—'}</Typography>
            )},
        {field: 'risk_designation', headerName: 'Təyinat', flex: 1.4, minWidth: 180, renderCell: (p) => (
                <Typography sx={{fontSize: 13, color: C.ink, fontWeight: 500}}>{p.value || '—'}</Typography>
            )},
        {
            field: 'action_type', headerName: 'Əməliyyat', width: 150,
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
            field: 'changes', headerName: 'Dəyişikliklər', flex: 1.8, minWidth: 220, sortable: false,
            renderCell: (p) => <Typography sx={{fontSize: 13, color: C.inkMuted}}>{summaryText(p.row)}</Typography>,
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
            field: 'timestamp', headerName: 'Tarix/Vaxt', width: 170,
            renderCell: (p) => (
                <Typography sx={{fontSize: 12, color: C.inkFaint}}>
                    {p.value ? new Date(p.value).toLocaleString('az-AZ') : '—'}
                </Typography>
            ),
        },
        {
            field: 'actions', headerName: '', width: 60, sortable: false, filterable: false, disableColumnMenu: true,
            renderCell: (p) => (
                <IconButton size="small" onClick={() => setDetailRow(p.row)} sx={{color: C.inkFaint}}>
                    <VisibilityOutlinedIcon sx={{fontSize: 17}}/>
                </IconButton>
            ),
        },
    ], []);

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

    const exportLogsToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tarixçə');

        worksheet.columns = [
            {header: 'ID', key: 'risk_id', width: 15},
            {header: 'Təyinat', key: 'designation', width: 30},
            {header: 'Əməliyyat', key: 'action', width: 20},
            {header: 'Dəyişikliklər', key: 'changes', width: 40},
            {header: 'İstifadəçi', key: 'user', width: 20},
            {header: 'Tarix/Vaxt', key: 'timestamp', width: 20},
        ];

        worksheet.getRow(1).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF2C3E50'}};
        worksheet.getRow(1).font = {color: {argb: 'FFFFFFFF'}, bold: true};
        worksheet.getRow(1).alignment = {horizontal: 'center'};

        rows.forEach((row) => {
            const changes = normalizeChanges(row);
            const changeText = row.action_type === 'created' ? 'Yeni qeyd yaradıldı' :
                row.action_type === 'deleted' ? 'Qeyd silindi' :
                    row.action_type === 'exported' ? `Excel-ə ixrac edildi (${row.changes?.row_count?.new ?? '—'} sətir)` :
                        changes.map(c => `${c.label}: ${c.old} -> ${c.new}`).join('; ');

            const item = worksheet.addRow({
                risk_id: `#${row.id}`,
                designation: row.risk_designation || '—',
                action: ACTION_META[row.action_type]?.label || row.action_type,
                changes: changeText,
                user: row.user?.name || row.user?.username || row.user_username_snapshot || '—',
                timestamp: row.timestamp ? new Date(row.timestamp).toLocaleString('az-AZ') : '—'
            });

            const actionCell = item.getCell(3);
            const colorMap = {created: '388E3C', updated: '0288D1', deleted: 'D32F2F', exported: '7B1FA2'};
            const color = colorMap[row.action_type] || '616161';
            actionCell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF' + color}};
            actionCell.font = {color: {argb: 'FFFFFFFF'}};
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'Risk_Tarixce.xlsx');

        try {
            await service_api.post(NEXT_API_ENDPOINTS.RISK.EXPORT_LOG, {
                export_type: 'risk_logs',
                row_count: rows.length,
                filters: {search, action_type: actionFilter, ordering},
            });
        } catch (e) {
            console.error('Export logu göndərilmədi:', e);
        }
    };


    return (
        <Box sx={{minHeight: '100vh', backgroundColor: C.bg, px: {xs: 2, md: 5}, py: 5}}>
           

            <Box sx={{maxWidth: 1440, mx: 'auto'}}>
                {/* Başlıq */}
                <Box sx={{mb: 4, pb: 3, borderBottom: `1px solid ${C.line}`}}>
                    <Typography sx={{ fontSize: 11, letterSpacing: '0.12em', color: C.gold, textTransform: 'uppercase', mb: 1}}>
                        Audit reyestri
                    </Typography>
                    <Box sx={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2}}>
                        <Box>
                            <Typography sx={{ fontSize: 28, fontWeight: 500, color: C.ink, lineHeight: 1.2}}>
                                Risk Reyestri — Tarixçə
                            </Typography>
                            <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.5}}>
                                {count} qeyd tapıldı
                            </Typography>
                        </Box>
                        <Button
                            startIcon={<FileDownloadIcon sx={{fontSize: 16}}/>}
                            onClick={exportLogsToExcel}
                            sx={{
                                color: C.gold, border: `1px solid ${C.goldMuted}`, borderRadius: '4px',
                                px: 2, py: 0.75, fontSize: 13, textTransform: 'none',
                                '&:hover': {backgroundColor: C.goldWash, border: `1px solid ${C.gold}`},
                            }}
                        >
                            Excel-ə ixrac
                        </Button>
                    </Box>
                </Box>

                {/* Filtr paneli */}
                <Box sx={{display: 'flex', gap: 1.5, mb: 4, flexWrap: 'wrap', alignItems: 'center'}}>
                    <TextField
                        size="small"
                        placeholder="Risk adı / sahə üzrə axtarış..."
                        value={search}
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
                        sx={{minWidth: 170}}
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

                    <Box sx={{flex: 1}}/>

                    <Box sx={{display: 'flex', border: `1px solid ${C.line}`, borderRadius: '4px', overflow: 'hidden'}}>
                        <IconButton
                            size="small"
                            onClick={() => setViewMode('timeline')}
                            sx={{
                                borderRadius: 0, px: 1.25,
                                color: viewMode === 'timeline' ? C.gold : C.inkFaint,
                                backgroundColor: viewMode === 'timeline' ? C.goldWash : 'transparent',
                                '&:hover': {backgroundColor: viewMode === 'timeline' ? C.goldWash : 'rgba(0,0,0,0.035)'},
                            }}
                        >
                            <ViewTimelineOutlinedIcon sx={{fontSize: 18}}/>
                        </IconButton>
                        <Box sx={{width: '1px', backgroundColor: C.line}}/>
                        <IconButton
                            size="small"
                            onClick={() => setViewMode('table')}
                            sx={{
                                borderRadius: 0, px: 1.25,
                                color: viewMode === 'table' ? C.gold : C.inkFaint,
                                backgroundColor: viewMode === 'table' ? C.goldWash : 'transparent',
                                '&:hover': {backgroundColor: viewMode === 'table' ? C.goldWash : 'rgba(0,0,0,0.035)'},
                            }}
                        >
                            <TableRowsOutlinedIcon sx={{fontSize: 18}}/>
                        </IconButton>
                    </Box>
                </Box>

                {/* Timeline rejimi */}
                {viewMode === 'timeline' && (
                    <>
                        {loading && (
                            <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
                                <CircularProgress size={22} sx={{color: C.gold}}/>
                            </Box>
                        )}

                        {!loading && rows.length === 0 && (
                            <Box sx={{textAlign: 'center', py: 8, border: `1px dashed ${C.line}`, borderRadius: '4px'}}>
                                <Typography sx={{fontSize: 14, color: C.inkMuted}}>Heç bir loq qeydi tapılmadı</Typography>
                            </Box>
                        )}

                        {!loading && rows.length > 0 && groups.map(([dateLabel, entries]) => (
                            <Box key={dateLabel} sx={{mb: 3}}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 2}}>
                                    <Typography sx={{ fontSize: 11, letterSpacing: '0.06em', color: C.inkFaint, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>
                                        {dateLabel}
                                    </Typography>
                                    <Box sx={{flex: 1, height: '1px', backgroundColor: C.line}}/>
                                </Box>
                                {entries.map((row, idx) => (
                                    <TimelineEntry
                                        key={row.id}
                                        row={row}
                                        isLast={idx === entries.length - 1}
                                        onOpen={setDetailRow}
                                    />
                                ))}
                            </Box>
                        ))}

                        {!loading && rows.length > 0 && (
                            <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2}}>
                                <Button
                                    size="small" disabled={paginationModel.page === 0}
                                    onClick={() => setPaginationModel((p) => ({...p, page: p.page - 1}))}
                                    sx={{color: C.inkMuted, textTransform: 'none'}}
                                >
                                    Əvvəlki
                                </Button>
                                <Button
                                    size="small" disabled={(paginationModel.page + 1) * paginationModel.pageSize >= count}
                                    onClick={() => setPaginationModel((p) => ({...p, page: p.page + 1}))}
                                    sx={{color: C.inkMuted, textTransform: 'none'}}
                                >
                                    Növbəti
                                </Button>
                            </Box>
                        )}
                    </>
                )}

                {/* DataGrid (cədvəl) rejimi */}
                {viewMode === 'table' && (
                    <Box sx={{height: 640, width: '100%'}}>
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
                )}
            </Box>

            <DetailDialog row={detailRow} onClose={() => setDetailRow(null)}/>
        </Box>
    );
}