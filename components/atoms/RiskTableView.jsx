"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {DataGrid} from '@mui/x-data-grid';
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

function DetailField({label, value}) {
    if (value === null || value === undefined || value === '') return null;
    return (
        <Box sx={{mb: 1.5}}>
            <Typography sx={{fontSize: 12, letterSpacing: '0.04em', color: C.inkFaint, textTransform: 'uppercase', fontWeight: 700, mb: 0.25}}>
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
                    <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', color: C.gold, textTransform: 'uppercase', mb: 0.5}}>
                        Reyestr № {row.id ?? '—'}
                    </Typography>
                    <Typography sx={{fontFamily: 'var(--font-serif)', fontSize: 20, color: C.ink, fontWeight: 700, lineHeight: 1.3}}>
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


export default function RiskTableView() {
    const {enqueueSnackbar} = useSnackbar();
    const userState = useAppSelector((state) => state.user);
    const isLoaded = userState?.isLoaded;

    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [treatmentFilter, setTreatmentFilter] = useState('');

    const [paginationModel, setPaginationModel] = useState({page: 0, pageSize: 10});
    const [detailRow, setDetailRow] = useState(null);

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
        params.set('page', String(paginationModel.page + 1));
        params.set('page_size', String(paginationModel.pageSize));
        return params.toString();
    }, [search, levelFilter, treatmentFilter, paginationModel]);

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
        fetchRisks();
    }, [fetchRisks]);

    useEffect(() => {
        if (isLoaded) logPageView('risk_table');
    }, [isLoaded]);

    useEffect(() => {
        const t = setTimeout(() => setPaginationModel((p) => ({...p, page: 0})), 300);
        return () => clearTimeout(t);
    }, [search]);

    const columns = useMemo(() => [
        {field: 'id', headerName: 'ID', width: 70, renderCell: (p) => (
                <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12}}>{p.value}</Typography>
            )},
        {field: 'designation', headerName: 'Təyinat', width: 220},
        {field: 'legal_basis', headerName: 'Hüquqi əsas', width: 220},
        {field: 'international_framework', headerName: 'Beynəlxalq çərçivə / istinad', width: 220},
        {field: 'national_legal_reference', headerName: 'Milli hüquqi istinad', width: 220},
        {field: 'asset_value', headerName: 'Aktivin dəyəri (H)', width: 110, renderCell: (p) => (
                <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12.5}}>{p.value ?? '—'}</Typography>
            )},
        {field: 'probability', headerName: 'Ehtimal (M)', width: 110, renderCell: (p) => (
                <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12.5}}>{p.value ?? '—'}</Typography>
            )},
        {field: 'impact', headerName: 'Təsir (N)', width: 100, renderCell: (p) => (
                <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12.5}}>{p.value ?? '—'}</Typography>
            )},
        {field: 'risk_degree', headerName: 'Risk dərəcəsi (P)', width: 130, renderCell: (p) => (
                <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12.5}}>{p.value ?? '—'}</Typography>
            )},
        {
            field: 'risk_level', headerName: 'Risk səviyyəsi', width: 140,
            renderCell: (p) => {
                const level = LEVEL_COLORS[p.value] || LEVEL_COLORS.low;
                const meta = RISK_LEVEL_META[p.value] || RISK_LEVEL_META.low;
                return (
                    <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: '3px', backgroundColor: level.bg, border: `1px solid ${level.ring}`}}>
                        <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: level.fg, flexShrink: 0}}/>
                        <Typography sx={{fontSize: 11, color: level.fg, fontWeight: 500, whiteSpace: 'nowrap'}}>{meta.label}</Typography>
                    </Box>
                );
            },
        },
        {
            field: 'treatment_option', headerName: 'Emal variantı (Q)', width: 190,
            renderCell: (p) => <Typography sx={{fontSize: 12.5}}>{treatmentLabel[p.value] || p.value}</Typography>,
        },
        {field: 'residual_risk', headerName: 'Qalıq risk (T)', width: 200},
        {field: 'update_frequency', headerName: 'Yenilənmə tarixi/tezliyi', width: 180},
        {field: 'incident_notification_notes', headerName: 'İnsident bildirişi qeydləri', width: 200},
        {field: 'standard_references', headerName: 'Standartlara istinadlar', width: 200},
        {
            field: 'created_by', headerName: 'Yaradan', width: 160,
            renderCell: (p) => <Typography sx={{fontSize: 12.5}}>{p.value?.name || p.value?.username || '—'}</Typography>,
        },
        {
            field: 'updated_by', headerName: 'Son dəyişikliyi edən', width: 160,
            renderCell: (p) => <Typography sx={{fontSize: 12.5}}>{p.value?.name || p.value?.username || '—'}</Typography>,
        },
        {
            field: 'created_at', headerName: 'Yaradılma tarixi', width: 160,
            renderCell: (p) => <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12}}>{p.value ? new Date(p.value).toLocaleString('az-AZ') : '—'}</Typography>,
        },
        {
            field: 'updated_at', headerName: 'Son dəyişiklik tarixi', width: 160,
            renderCell: (p) => <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12}}>{p.value ? new Date(p.value).toLocaleString('az-AZ') : '—'}</Typography>,
        },
        {
            field: 'actions', headerName: 'Əməliyyat', width: 90, sortable: false, filterable: false, disableColumnMenu: true,
            renderCell: (p) => (
                <Tooltip title="Ətraflı bax">
                    <IconButton size="small" onClick={() => setDetailRow(p.row)} sx={{color: C.inkFaint}}>
                        <VisibilityOutlinedIcon sx={{fontSize: 17}}/>
                    </IconButton>
                </Tooltip>
            ),
        },
    ], [treatmentLabel]);

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Risk Cədvəli');

        const exportCols = columns.filter((c) => c.field !== 'actions');
        worksheet.columns = exportCols.map((c) => ({header: c.headerName, key: c.field, width: Math.max(14, Math.round(c.width / 7))}));

        worksheet.getRow(1).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF2C3E50'}};
        worksheet.getRow(1).font = {color: {argb: 'FFFFFFFF'}, bold: true};
        worksheet.getRow(1).alignment = {horizontal: 'center', wrapText: true};

        rows.forEach((row) => {
            const record = {};
            exportCols.forEach((c) => {
                if (c.field === 'created_by' || c.field === 'updated_by') {
                    record[c.field] = row[c.field]?.name || row[c.field]?.username || '—';
                } else if (c.field === 'created_at' || c.field === 'updated_at') {
                    record[c.field] = row[c.field] ? new Date(row[c.field]).toLocaleString('az-AZ') : '—';
                } else if (c.field === 'treatment_option') {
                    record[c.field] = treatmentLabel[row[c.field]] || row[c.field];
                } else if (c.field === 'risk_level') {
                    record[c.field] = RISK_LEVEL_META[row[c.field]]?.label || row[c.field];
                } else {
                    const v = row[c.field];
                    record[c.field] = v === null || v === undefined || v === '' ? '—' : v;
                }
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
                            sx: {color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px', '& .MuiOutlinedInput-notchedOutline': {borderColor: C.line}},
                        }}
                        sx={{minWidth: 240}}
                    />
                    <TextField
                        select size="small" value={levelFilter}
                        onChange={(e) => {setLevelFilter(e.target.value); setPaginationModel((p) => ({...p, page: 0}));}}
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
                        onChange={(e) => {setTreatmentFilter(e.target.value); setPaginationModel((p) => ({...p, page: 0}));}}
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

                <Box sx={{height: 640, width: '100%'}}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        getRowId={(row) => row.id}
                        loading={loading}
                        rowCount={count}
                        paginationMode="server"
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        pageSizeOptions={[10, 20, 50]}
                        disableRowSelectionOnClick
                        disableColumnFilter
                        sortingMode="client"
                        localeText={{noRowsLabel: 'Heç bir qeyd tapılmadı'}}
                        sx={gridSx}
                    />
                </Box>
            </Box>

            <RiskDetailDialog row={detailRow} onClose={() => setDetailRow(null)} treatmentLabel={treatmentLabel}/>
        </Box>
    );
}