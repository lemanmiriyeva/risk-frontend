"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError, logPageView} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {TREATMENT_OPTIONS, RISK_LEVEL_META} from "./RiskFormDialog";
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

// Cədvəldə görünəcək BÜTÜN sahələr (Risk cədvəlinə baxış modulu bütün field-ləri göstərir)
const COLUMNS = [
    {field: 'id', label: 'ID', width: 60},
    {field: 'designation', label: 'Təyinat', width: 220},
    {field: 'legal_basis', label: 'Hüquqi əsas', width: 220},
    {field: 'international_framework', label: 'Beynəlxalq çərçivə / istinad', width: 220},
    {field: 'national_legal_reference', label: 'Milli hüquqi istinad', width: 220},
    {field: 'asset_value', label: 'Aktivin dəyəri (H)', width: 100},
    {field: 'probability', label: 'Ehtimal (M)', width: 100},
    {field: 'impact', label: 'Təsir (N)', width: 90},
    {field: 'risk_degree', label: 'Risk dərəcəsi (P)', width: 110},
    {field: 'risk_level', label: 'Risk səviyyəsi', width: 130},
    {field: 'treatment_option', label: 'Emal variantı (Q)', width: 180},
    {field: 'residual_risk', label: 'Qalıq risk (T)', width: 200},
    {field: 'update_frequency', label: 'Yenilənmə tarixi/tezliyi', width: 180},
    {field: 'incident_notification_notes', label: 'İnsident bildirişi qeydləri', width: 200},
    {field: 'standard_references', label: 'Standartlara istinadlar', width: 200},
    {field: 'created_by', label: 'Yaradan', width: 160},
    {field: 'updated_by', label: 'Son dəyişikliyi edən', width: 160},
    {field: 'created_at', label: 'Yaradılma tarixi', width: 150},
    {field: 'updated_at', label: 'Son dəyişiklik tarixi', width: 150},
];

function cellValue(row, field, treatmentLabel) {
    switch (field) {
        case 'risk_level':
            return RISK_LEVEL_META[row.risk_level]?.label || row.risk_level;
        case 'treatment_option':
            return treatmentLabel[row.treatment_option] || row.treatment_option;
        case 'created_by':
            return row.created_by?.name || row.created_by?.username || '—';
        case 'updated_by':
            return row.updated_by?.name || row.updated_by?.username || '—';
        case 'created_at':
        case 'updated_at':
            return row[field] ? new Date(row[field]).toLocaleString('az-AZ') : '—';
        default: {
            const v = row[field];
            return v === null || v === undefined || v === '' ? '—' : String(v);
        }
    }
}

function RiskFullRow({row, treatmentLabel}) {
    const level = LEVEL_COLORS[row.risk_level] || LEVEL_COLORS.low;
    return (
        <Box sx={{display: 'flex', borderBottom: `1px solid ${C.line}`, '&:hover': {backgroundColor: 'rgba(0,0,0,0.015)'}}}>
            {COLUMNS.map((col) => {
                const value = cellValue(row, col.field, treatmentLabel);
                if (col.field === 'risk_level') {
                    return (
                        <Box key={col.field} sx={{width: col.width, flexShrink: 0, px: 1.5, py: 1.2, display: 'flex', alignItems: 'center'}}>
                            <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: '3px', backgroundColor: level.bg, border: `1px solid ${level.ring}`}}>
                                <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: level.fg, flexShrink: 0}}/>
                                <Typography sx={{fontSize: 11, color: level.fg, fontWeight: 500, whiteSpace: 'nowrap'}}>{value}</Typography>
                            </Box>
                        </Box>
                    );
                }
                return (
                    <Tooltip key={col.field} title={String(value).length > 28 ? value : ''}>
                        <Box sx={{width: col.width, flexShrink: 0, px: 1.5, py: 1.2, display: 'flex', alignItems: 'center'}}>
                            <Typography sx={{
                                fontSize: 12.5, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap', fontFamily: ['risk_degree', 'asset_value', 'probability', 'impact', 'id'].includes(col.field) ? 'var(--font-mono)' : 'inherit',
                            }}>
                                {value}
                            </Typography>
                        </Box>
                    </Tooltip>
                );
            })}
        </Box>
    );
}

export default function RiskTableView() {
    const {enqueueSnackbar} = useSnackbar();
    const userState = useAppSelector((state) => state.user);
    const isLoaded = userState?.isLoaded;
    const permissions = userState?.permissions || [];
    const canView = permissions.includes('risk.view_risk');

    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [treatmentFilter, setTreatmentFilter] = useState('');

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const treatmentLabel = useMemo(() => {
        const map = {};
        TREATMENT_OPTIONS.forEach((o) => (map[o.value] = o.label));
        return map;
    }, []);

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (levelFilter) params.set('risk_level', levelFilter);
        if (treatmentFilter) params.set('treatment_option', treatmentFilter);
        params.set('ordering', '-created_at');
        params.set('page', String(page + 1));
        params.set('page_size', String(pageSize));
        return params.toString();
    }, [search, levelFilter, treatmentFilter, page, pageSize]);

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
        if (isLoaded && canView) logPageView('risk_table');
    }, [isLoaded, canView]);

    useEffect(() => {
        const t = setTimeout(() => setPage(0), 300);
        return () => clearTimeout(t);
    }, [search]);

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Risk Cədvəli');

        worksheet.columns = COLUMNS.map((c) => ({header: c.label, key: c.field, width: Math.max(14, Math.round(c.width / 7))}));

        worksheet.getRow(1).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF2C3E50'}};
        worksheet.getRow(1).font = {color: {argb: 'FFFFFFFF'}, bold: true};
        worksheet.getRow(1).alignment = {horizontal: 'center', wrapText: true};

        rows.forEach((row) => {
            const record = {};
            COLUMNS.forEach((c) => {
                record[c.field] = cellValue(row, c.field, treatmentLabel);
            });
            worksheet.addRow(record);
        });

        worksheet.eachRow((r) => r.eachCell((cell) => {
            cell.alignment = {...(cell.alignment || {}), wrapText: true, vertical: 'top'};
        }));

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), 'Risk_Cedveli_Tam.xlsx');

        try {
            await service_api.post(NEXT_API_ENDPOINTS.RISK.EXPORT_LOG, {
                export_type: 'risk_table',
                row_count: rows.length,
                filters: {search, risk_level: levelFilter, treatment_option: treatmentFilter},
            });
        } catch (e) {
            console.error('Export logu göndərilmədi:', e);
        }
    };

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
                        Risk cədvəlinə baxmaq üçün sistem administratoru ilə əlaqə saxlayın.
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
                <Box sx={{mb: 4, pb: 3, borderBottom: `1px solid ${C.line}`}}>
                    <Link href="/risk" style={{textDecoration: 'none'}}>
                        <Typography sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12.5,
                            color: C.inkMuted, mb: 1.5, '&:hover': {color: C.gold},
                        }}>
                            <ArrowBackIcon sx={{fontSize: 14}}/> Risklərə baxış
                        </Typography>
                    </Link>
                    <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', color: C.gold, textTransform: 'uppercase', mb: 1}}>
                        Reyestr — Salt oxuma
                    </Typography>
                    <Box sx={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2}}>
                        <Box>
                            <Typography sx={{fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 500, color: C.ink, lineHeight: 1.2}}>
                                Risk Cədvəlinə Baxış
                            </Typography>
                            <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.5}}>
                                {count} risk qeydi — bütün sahələr göstərilir
                            </Typography>
                        </Box>
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
                    </Box>
                </Box>

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
                            sx: {color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px'},
                        }}
                        sx={{minWidth: 170}}
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
                            sx: {color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px'},
                        }}
                        sx={{minWidth: 190}}
                    >
                        <MenuItem value="" sx={{color: C.ink, fontSize: 13}}>Hamısı</MenuItem>
                        {TREATMENT_OPTIONS.map((o) => (
                            <MenuItem key={o.value} value={o.value} sx={{color: C.ink, fontSize: 13}}>{o.label}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                <Box sx={{border: `1px solid ${C.line}`, borderRadius: '4px', backgroundColor: C.surface, overflowX: 'auto'}}>
                    <Box sx={{minWidth: COLUMNS.reduce((s, c) => s + c.width, 0)}}>
                        <Box sx={{display: 'flex', borderBottom: `1px solid ${C.lineStrong}`, position: 'sticky', top: 0, backgroundColor: C.surface, zIndex: 1}}>
                            {COLUMNS.map((col) => (
                                <Box key={col.field} sx={{width: col.width, flexShrink: 0, px: 1.5, py: 1.25}}>
                                    <Typography sx={{fontSize: 10.5, letterSpacing: '0.05em', color: C.inkFaint, textTransform: 'uppercase', fontWeight: 500}}>
                                        {col.label}
                                    </Typography>
                                </Box>
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
                            <RiskFullRow key={row.id} row={row} treatmentLabel={treatmentLabel}/>
                        ))}
                    </Box>
                </Box>

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
                        color: C.inkMuted, fontSize: 13,
                        '& .MuiTablePagination-selectIcon': {color: C.inkMuted},
                        '& .MuiIconButton-root.Mui-disabled': {color: C.inkFaint},
                        '& .MuiIconButton-root': {color: C.inkMuted},
                    }}
                />
            </Box>
        </Box>
    );
}