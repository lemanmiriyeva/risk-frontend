"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseIcon from '@mui/icons-material/Close';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import RiskFormDialog, {TREATMENT_OPTIONS, RISK_LEVEL_META} from "./RiskFormDialog";
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

const LEVEL_COLORS = {
    critical: {fg: '#A23B3B', bg: 'rgba(162,59,59,0.08)', ring: 'rgba(162,59,59,0.3)'},
    high: {fg: '#B0741F', bg: 'rgba(176,116,31,0.08)', ring: 'rgba(176,116,31,0.3)'},
    medium: {fg: '#8A7A2E', bg: 'rgba(138,122,46,0.08)', ring: 'rgba(138,122,46,0.3)'},
    low: {fg: '#2F6B4F', bg: 'rgba(47,107,79,0.08)', ring: 'rgba(47,107,79,0.3)'},
};

const RISK_LEVEL_FILTERS = [
    {value: '', label: 'Hamısı'},
    {value: 'critical', label: 'Kritik'},
    {value: 'high', label: 'Yüksək'},
    {value: 'medium', label: 'Orta'},
    {value: 'low', label: 'Aşağı'},
];

const COLUMNS = [
    {field: 'designation', label: 'Təyinat', width: '2.2fr', sortable: true},
    {field: 'risk_degree', label: 'Dərəcə', width: '90px', sortable: true, center: true},
    {field: 'risk_level', label: 'Səviyyə', width: '120px', sortable: false, center: true},
    {field: 'treatment_option', label: 'Emal variantı', width: '1.3fr', sortable: false},
    {field: 'created_by', label: 'Yaradan', width: '1.1fr', sortable: false},
    {field: 'updated_at', label: 'Son dəyişiklik', width: '150px', sortable: true},
    {field: '', label: '', width: '110px', sortable: false},
];

const GRID_COLS = COLUMNS.map((c) => c.width).join(' ');

function initialsOf(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    return (parts[0]?.[0] || '').concat(parts[1]?.[0] || '').toUpperCase() || '?';
}

function DetailField({label, value}) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <Box sx={{mb: 1.5}}>
            <Typography sx={{fontSize: 11, letterSpacing: '0.04em', color: C.inkFaint, textTransform: 'uppercase', fontWeight: 500, mb: 0.25}}>
                {label}
            </Typography>
            <Typography sx={{fontSize: 13.5, color: C.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                {value}
            </Typography>
        </Box>
    );
}

function RiskDetailDialog({row, onClose, treatmentLabel}) {
    if (!row) return null;
    const level = LEVEL_COLORS[row.risk_level] || LEVEL_COLORS.low;
    const meta = RISK_LEVEL_META[row.risk_level] || RISK_LEVEL_META.low;

    return (
        <Dialog
            open onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{sx: {backgroundColor: C.surface, backgroundImage: 'none', border: `1px solid ${C.line}`, borderRadius: '4px'}}}
        >
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`}}>
                <Box>
                    <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: C.gold, textTransform: 'uppercase', mb: 0.5}}>
                        Reyestr № {row.id ?? '—'}
                    </Typography>
                    <Typography sx={{fontFamily: 'var(--font-serif)', fontSize: 20, color: C.ink, fontWeight: 500, lineHeight: 1.3}}>
                        {row.designation}
                    </Typography>
                    <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1, px: 1, py: 0.4, borderRadius: '3px', backgroundColor: level.bg, border: `1px solid ${level.ring}`}}>
                        <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: level.fg}}/>
                        <Typography sx={{fontSize: 12, color: level.fg, fontWeight: 500}}>{meta.label}</Typography>
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, maxHeight: '60vh', overflowY: 'auto'}}>
                <Box sx={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2}}>
                    <DetailField label="Risk dərəcəsi (P)" value={`${row.risk_degree} / 125`}/>
                    <DetailField label="Emal variantı (Q)" value={treatmentLabel[row.treatment_option] || row.treatment_option}/>
                </Box>
                <Box sx={{borderTop: `1px solid ${C.line}`, pt: 2, mb: 2}}>
                    <DetailField label="Hüquqi əsas" value={row.legal_basis}/>
                    <DetailField label="Beynəlxalq çərçivələr / Çərçivə istinadı" value={row.international_framework}/>
                    <DetailField label="Milli hüquqi istinad" value={row.national_legal_reference}/>
                </Box>
                <Box sx={{borderTop: `1px solid ${C.line}`, pt: 2, mb: 2, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2}}>
                    <DetailField label="Aktivin dəyəri (H)" value={row.asset_value}/>
                    <DetailField label="Ehtimal (M)" value={row.probability}/>
                    <DetailField label="Təsir (N)" value={row.impact}/>
                </Box>
                <Box sx={{borderTop: `1px solid ${C.line}`, pt: 2, mb: 2}}>
                    <DetailField label="Qalıq risk (T)" value={row.residual_risk}/>
                    <DetailField label="Yenilənmə tarixi/tezliyi" value={row.update_frequency}/>
                    <DetailField label="İnsident bildirişi qeydləri" value={row.incident_notification_notes}/>
                    <DetailField label="Standartlara istinadlar" value={row.standard_references}/>
                </Box>
                <Box sx={{borderTop: `1px solid ${C.line}`, pt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2}}>
                    <DetailField label="Yaradan" value={row.created_by?.name || row.created_by?.username}/>
                    <DetailField label="Yaradılma tarixi" value={row.created_at ? new Date(row.created_at).toLocaleString('az-AZ') : null}/>
                    <DetailField label="Son dəyişikliyi edən" value={row.updated_by?.name || row.updated_by?.username}/>
                    <DetailField label="Son dəyişiklik tarixi" value={row.updated_at ? new Date(row.updated_at).toLocaleString('az-AZ') : null}/>
                </Box>
            </Box>

            <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${C.line}`, pt: 2}}>
                <Button onClick={onClose} sx={{color: C.inkMuted, '&:hover': {backgroundColor: 'rgba(0,0,0,0.035)'}}}>
                    Bağla
                </Button>
            </Box>
        </Dialog>
    );
}

function SortableHeader({col, ordering, onSort}) {
    const active = ordering.replace('-', '') === col.field;
    const desc = ordering === `-${col.field}`;
    return (
        <Box
            onClick={col.sortable ? () => onSort(col.field) : undefined}
            sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                justifyContent: col.center ? 'center' : 'flex-start',
                cursor: col.sortable ? 'pointer' : 'default',
                userSelect: 'none',
            }}
        >
            <Typography sx={{fontSize: 11, letterSpacing: '0.05em', color: active ? C.ink : C.inkFaint, textTransform: 'uppercase', fontWeight: 500}}>
                {col.label}
            </Typography>
            {col.sortable && active && (
                desc ? <ArrowDownwardIcon sx={{fontSize: 13, color: C.gold}}/> : <ArrowUpwardIcon sx={{fontSize: 13, color: C.gold}}/>
            )}
        </Box>
    );
}

function RiskRow({row, treatmentLabel, canEdit, canDelete, onView, onEdit, onDelete}) {
    const level = LEVEL_COLORS[row.risk_level] || LEVEL_COLORS.low;
    const meta = RISK_LEVEL_META[row.risk_level] || RISK_LEVEL_META.low;
    const creatorName = row.created_by?.name || row.created_by?.username || '—';

    return (
        <Box sx={{
            display: 'grid', gridTemplateColumns: GRID_COLS, gap: 1.5, alignItems: 'center',
            px: 2, py: 1.4, borderBottom: `1px solid ${C.line}`,
            '&:hover': {backgroundColor: 'rgba(0,0,0,0.015)'},
        }}>
            <Tooltip title={row.designation?.length > 44 ? row.designation : ''}>
                <Typography sx={{fontSize: 13.5, color: C.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {row.designation}
                </Typography>
            </Tooltip>

            <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 13, color: C.inkMuted, textAlign: 'center'}}>
                {row.risk_degree}
            </Typography>

            <Box sx={{display: 'flex', justifyContent: 'center'}}>
                <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: '3px', backgroundColor: level.bg, border: `1px solid ${level.ring}`}}>
                    <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: level.fg, flexShrink: 0}}/>
                    <Typography sx={{fontSize: 11, color: level.fg, fontWeight: 500, whiteSpace: 'nowrap'}}>{meta.label}</Typography>
                </Box>
            </Box>

            <Typography sx={{fontSize: 13, color: C.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                {treatmentLabel[row.treatment_option] || row.treatment_option}
            </Typography>

            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden'}}>
                <Box sx={{
                    width: 18, height: 18, borderRadius: '50%', backgroundColor: C.goldWash,
                    border: `1px solid ${C.goldMuted}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: C.gold, fontWeight: 600, flexShrink: 0,
                }}>
                    {initialsOf(creatorName)}
                </Box>
                <Typography sx={{fontSize: 12.5, color: C.inkMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {creatorName}
                </Typography>
            </Box>

            <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12, color: C.inkFaint, whiteSpace: 'nowrap'}}>
                {row.updated_at ? new Date(row.updated_at).toLocaleString('az-AZ') : '—'}
            </Typography>

            <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 0.25}}>
                <Tooltip title="Ətraflı bax">
                    <IconButton size="small" onClick={() => onView(row)} sx={{color: C.inkFaint}}>
                        <VisibilityOutlinedIcon sx={{fontSize: 17}}/>
                    </IconButton>
                </Tooltip>
                {canEdit && (
                    <Tooltip title="Redaktə et">
                        <IconButton size="small" onClick={() => onEdit(row)} sx={{color: C.inkFaint}}>
                            <EditOutlinedIcon sx={{fontSize: 17}}/>
                        </IconButton>
                    </Tooltip>
                )}
                {canDelete && (
                    <Tooltip title="Sil">
                        <IconButton size="small" onClick={() => onDelete(row)} sx={{color: '#A23B3B'}}>
                            <DeleteOutlineIcon sx={{fontSize: 17}}/>
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
}


export default function RiskRegistryPage() {
    const {enqueueSnackbar} = useSnackbar();
    const userState = useAppSelector((state) => state.user);
    const isLoaded = userState?.isLoaded;
    const permissions = userState?.permissions || [];

    const canView = permissions.includes('risk.view_risk');
    const canCreate = permissions.includes('risk.add_risk');
    const canEdit = permissions.includes('risk.change_risk');
    const canDelete = permissions.includes('risk.delete_risk');

    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [treatmentFilter, setTreatmentFilter] = useState('');
    const [ordering, setOrdering] = useState('-created_at');

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [detailRow, setDetailRow] = useState(null);

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (levelFilter) params.set('risk_level', levelFilter);
        if (treatmentFilter) params.set('treatment_option', treatmentFilter);
        if (ordering) params.set('ordering', ordering);
        params.set('page', String(page + 1));
        params.set('page_size', String(pageSize));
        return params.toString();
    }, [search, levelFilter, treatmentFilter, ordering, page, pageSize]);

    const treatmentLabel = useMemo(() => {
        const map = {};
        TREATMENT_OPTIONS.forEach((o) => (map[o.value] = o.label));
        return map;
    }, []);

    const exportToExcel = async () => {
        const levelMap = {critical: 'Kritik', high: 'Yüksək', medium: 'Orta', low: 'Aşağı'};

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Risk Reyestri');

        worksheet.columns = [
            {header: 'Təyinat', key: 'designation', width: 30},
            {header: 'Risk dərəcəsi', key: 'risk_degree', width: 15},
            {header: 'Risk səviyyəsi', key: 'risk_level', width: 20},
            {header: 'Emal variantı', key: 'treatment_option', width: 25},
            {header: 'Yaradan', key: 'created_by', width: 20},
            {header: 'Son dəyişiklik', key: 'updated_at', width: 20},
        ];

        worksheet.getRow(1).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF2C3E50'}};
        worksheet.getRow(1).font = {color: {argb: 'FFFFFFFF'}, bold: true};
        worksheet.getRow(1).alignment = {horizontal: 'center'};

        rows.forEach((row) => {
            const translatedLevel = levelMap[row.risk_level] || row.risk_level;
            const item = worksheet.addRow({
                designation: row.designation,
                risk_degree: row.risk_degree,
                risk_level: translatedLevel,
                treatment_option: treatmentLabel[row.treatment_option] || row.treatment_option,
                created_by: row.created_by?.name || row.created_by?.username,
                updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString('az-AZ') : '—'
            });

            const cell = item.getCell(3);
            if (row.risk_level === 'critical') {
                cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFD32F2F'}};
                cell.font = {color: {argb: 'FFFFFFFF'}};
            } else if (row.risk_level === 'high') {
                cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFFFA000'}};
                cell.font = {color: {argb: 'FF000000'}};
            } else if (row.risk_level === 'low') {
                cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF388E3C'}};
                cell.font = {color: {argb: 'FFFFFFFF'}};
            }
            item.alignment = {horizontal: 'center'};
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'Risk_Reyestri.xlsx');

        try {
            await service_api.post(NEXT_API_ENDPOINTS.RISK.EXPORT_LOG, {
                export_type: 'risk_list',
                row_count: rows.length,
                filters: {search, risk_level: levelFilter, treatment_option: treatmentFilter, ordering},
            });
        } catch (e) {
            console.error('Export logu göndərilmədi:', e);
        }
    };

    const fetchRisks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.RISK.LIST}?${buildQuery()}`);
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
        if (canView) fetchRisks();
    }, [canView, fetchRisks]);

    useEffect(() => {
        const t = setTimeout(() => setPage(0), 300);
        return () => clearTimeout(t);
    }, [search]);

    function handleSort(field) {
        setOrdering((cur) => (cur === field ? `-${field}` : field));
    }

    function openCreate() {
        setEditingRow(null);
        setFormOpen(true);
    }

    function openEdit(row) {
        setEditingRow(row);
        setFormOpen(true);
    }

    async function handleFormSubmit(form) {
        setSaving(true);
        try {
            if (editingRow) {
                await service_api.patch(`${NEXT_API_ENDPOINTS.RISK.LIST}/${editingRow.id}`, form);
                enqueueSnackbar('Risk yeniləndi.', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.RISK.LIST, form);
                enqueueSnackbar('Risk yaradıldı.', {variant: 'success'});
            }
            setFormOpen(false);
            fetchRisks();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteConfirm() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await service_api.delete(`${NEXT_API_ENDPOINTS.RISK.LIST}/${deleteTarget.id}`);
            enqueueSnackbar('Risk silindi.', {variant: 'success'});
            setDeleteTarget(null);
            fetchRisks();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setDeleting(false);
        }
    }

    if (!isLoaded) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg}}>
                <CircularProgress size={22} sx={{color: C.gold}}/>
            </Box>
        );
    }

    if (!canView) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg}}>
                <Box sx={{textAlign: 'center', maxWidth: 360}}>
                    <Typography sx={{fontFamily: 'var(--font-serif)', fontSize: 20, color: C.ink, mb: 1}}>Giriş icazəniz yoxdur</Typography>
                    <Typography sx={{fontSize: 14, color: C.inkMuted}}>
                        Risk Reyestrinə baxmaq üçün sistem administratoru ilə əlaqə saxlayın.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{minHeight: '100vh', backgroundColor: C.bg, px: {xs: 2, md: 5}, py: 5}}>
            <GlobalStyles styles={{
                '@import': "url('https://fonts.googleapis.com/css2?family=Newsreader:wght@500;600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap')",
                ':root': {
                    '--font-serif': "'Newsreader', serif",
                    '--font-mono': "'IBM Plex Mono', monospace",
                },
                body: {fontFamily: "'Inter', sans-serif"},
            }}/>

            <Box sx={{maxWidth: 1440, mx: 'auto'}}>
                {/* Başlıq */}
                <Box sx={{mb: 4, pb: 3, borderBottom: `1px solid ${C.line}`}}>
                    <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: C.gold, textTransform: 'uppercase', mb: 1}}>
                        Reyestr
                    </Typography>
                    <Box sx={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2}}>
                        <Box>
                            <Typography sx={{fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500, color: C.ink, lineHeight: 1.2}}>
                                Risk Reyestri
                            </Typography>
                            <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.5}}>
                                {count} risk qeydi tapıldı
                            </Typography>
                        </Box>
                        <Box sx={{display: 'flex', gap: 1}}>
                            <Button
                                startIcon={<FileDownloadIcon sx={{fontSize: 16}}/>}
                                onClick={exportToExcel}
                                sx={{
                                    color: C.gold, border: `1px solid ${C.goldMuted}`, borderRadius: '4px',
                                    px: 2, py: 0.75, fontSize: 13, textTransform: 'none',
                                    '&:hover': {backgroundColor: C.goldWash, border: `1px solid ${C.gold}`},
                                }}
                            >
                                Excel-ə ixrac
                            </Button>
                            {canCreate && (
                                <Button
                                    startIcon={<AddIcon sx={{fontSize: 17}}/>}
                                    onClick={openCreate}
                                    sx={{
                                        backgroundColor: C.ink, color: C.surface, borderRadius: '4px',
                                        px: 2.25, py: 0.75, fontSize: 13, textTransform: 'none',
                                        '&:hover': {backgroundColor: '#33302A'},
                                    }}
                                >
                                    Yeni risk yarat
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Filtr paneli */}
                <Box sx={{display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center'}}>
                    <TextField
                        size="small"
                        placeholder="Axtarış..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>,
                            sx: {
                                color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px',
                                '& .MuiOutlinedInput-notchedOutline': {borderColor: C.line},
                                '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: C.lineStrong},
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: C.gold},
                            },
                        }}
                        sx={{minWidth: 240}}
                    />
                    <TextField
                        select size="small" value={levelFilter}
                        onChange={(e) => {setLevelFilter(e.target.value); setPage(0);}}
                        SelectProps={{
                            displayEmpty: true,
                            renderValue: (v) => RISK_LEVEL_FILTERS.find((o) => o.value === v)?.label || 'Risk səviyyəsi',
                            sx: {
                                color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px',
                                '& .MuiOutlinedInput-notchedOutline': {borderColor: C.line},
                            },
                            MenuProps: {PaperProps: {sx: {backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`}}},
                        }}
                        sx={{minWidth: 170, '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: C.lineStrong}}}
                    >
                        {RISK_LEVEL_FILTERS.map((o) => (
                            <MenuItem key={o.value} value={o.value} sx={{color: C.ink, fontSize: 13}}>{o.label}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select size="small" value={treatmentFilter}
                        onChange={(e) => {setTreatmentFilter(e.target.value); setPage(0);}}
                        SelectProps={{
                            displayEmpty: true,
                            renderValue: (v) => (v ? treatmentLabel[v] : 'Emal variantı'),
                            sx: {
                                color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px',
                                '& .MuiOutlinedInput-notchedOutline': {borderColor: C.line},
                            },
                            MenuProps: {PaperProps: {sx: {backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`}}},
                        }}
                        sx={{minWidth: 190, '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: C.lineStrong}}}
                    >
                        <MenuItem value="" sx={{color: C.ink, fontSize: 13}}>Hamısı</MenuItem>
                        {TREATMENT_OPTIONS.map((o) => (
                            <MenuItem key={o.value} value={o.value} sx={{color: C.ink, fontSize: 13}}>{o.label}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                {/* Cədvəl */}
                <Box sx={{border: `1px solid ${C.line}`, borderRadius: '4px', overflow: 'hidden', backgroundColor: C.surface}}>
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: GRID_COLS, gap: 1.5,
                        px: 2, py: 1.25, borderBottom: `1px solid ${C.lineStrong}`,
                    }}>
                        {COLUMNS.map((col) => (
                            <SortableHeader key={col.field || col.label} col={col} ordering={ordering} onSort={handleSort}/>
                        ))}
                    </Box>

                    {loading && (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                            <CircularProgress size={20} sx={{color: C.gold}}/>
                        </Box>
                    )}

                    {!loading && rows.length === 0 && (
                        <Box sx={{textAlign: 'center', py: 6}}>
                            <Typography sx={{fontSize: 14, color: C.inkMuted}}>Heç bir qeyd tapılmadı</Typography>
                        </Box>
                    )}

                    {!loading && rows.map((row) => (
                        <RiskRow
                            key={row.id}
                            row={row}
                            treatmentLabel={treatmentLabel}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onView={setDetailRow}
                            onEdit={openEdit}
                            onDelete={setDeleteTarget}
                        />
                    ))}

                    <TablePagination
                        component="div"
                        count={count}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={pageSize}
                        onRowsPerPageChange={(e) => {setPageSize(parseInt(e.target.value, 10)); setPage(0);}}
                        rowsPerPageOptions={[10, 20, 50]}
                        labelRowsPerPage="Sətir sayı:"
                        sx={{
                            color: C.inkMuted, fontSize: 13, borderTop: `1px solid ${C.line}`,
                            '& .MuiTablePagination-selectIcon': {color: C.inkMuted},
                            '& .MuiIconButton-root.Mui-disabled': {color: C.inkFaint},
                            '& .MuiIconButton-root': {color: C.inkMuted},
                        }}
                    />
                </Box>
            </Box>

            <RiskFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingRow}
                loading={saving}
            />

            <RiskDetailDialog row={detailRow} onClose={() => setDetailRow(null)} treatmentLabel={treatmentLabel}/>

            <Dialog
                open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
                PaperProps={{sx: {backgroundColor: C.surface, backgroundImage: 'none', border: `1px solid ${C.line}`, borderRadius: '4px', maxWidth: 420}}}
            >
                <Box sx={{px: 3, pt: 3, pb: 2}}>
                    <Typography sx={{fontFamily: 'var(--font-serif)', fontSize: 18, color: C.ink, fontWeight: 500, mb: 1}}>
                        Əminsiniz?
                    </Typography>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                        "{deleteTarget?.designation}" adlı risk qeydi silinəcək. Bu əməliyyat loqlanacaq.
                    </Typography>
                </Box>
                <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                    <Button
                        onClick={() => setDeleteTarget(null)} disabled={deleting}
                        sx={{color: C.inkMuted, '&:hover': {backgroundColor: 'rgba(0,0,0,0.035)'}}}
                    >
                        İmtina
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm} disabled={deleting}
                        sx={{
                            backgroundColor: '#A23B3B', color: '#fff', px: 2.25, textTransform: 'none',
                            '&:hover': {backgroundColor: '#8A2F2F'},
                            '&.Mui-disabled': {backgroundColor: 'rgba(162,59,59,0.4)', color: '#fff'},
                        }}
                    >
                        Sil
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}