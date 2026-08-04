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
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {DATA_GRID_LOCALE_AZ} from "@/lib/dataGridLocaleAz";
import RiskFormDialog, {TREATMENT_OPTIONS, RISK_LEVEL_META} from "./RiskFormDialog";


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

// DataGrid sort field -> DRF ordering field (eyni adlıdırsa map lazım deyil)
const SORT_FIELD_MAP = {
    designation: 'designation',
    risk_degree: 'risk_degree',
    updated_at: 'updated_at',
    created_at: 'created_at',
};

function initialsOf(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    return (parts[0]?.[0] || '').concat(parts[1]?.[0] || '').toUpperCase() || '?';
}

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
                    <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: C.gold, textTransform: 'uppercase', mb: 0.5}}>
                        Reyestr № {row.id ?? '—'}
                    </Typography>
                    <Typography sx={{fontSize: 20, color: C.ink, fontWeight: 500, lineHeight: 1.3}}>
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
                <Box sx={{mb: 2}}>
                    <DetailField
                        label="Əlaqəli inventar"
                        value={row.inventory ? `${row.inventory.inventory_number} — ${row.inventory.product_name} (${row.inventory.owner_display})` : null}
                    />
                </Box>
                <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mb: 2}}>
                    <DetailField label="Risk dərəcəsi (P)" value={`${row.risk_degree} / 125`}/>
                    <DetailField label="Emal variantı (Q)" value={treatmentLabel[row.treatment_option] || row.treatment_option}/>
                </Box>
                <Box sx={{borderTop: `1px solid ${C.line}`, pt: 2, mb: 2}}>
                    <DetailField label="Hüquqi əsas" value={row.legal_basis}/>
                    <DetailField label="Beynəlxalq çərçivələr / Çərçivə istinadı" value={row.international_framework}/>
                    <DetailField label="Milli hüquqi istinad" value={row.national_legal_reference}/>
                </Box>
                <Box sx={{borderTop: `1px solid ${C.line}`, pt: 2, mb: 2, display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr 1fr'}, gap: 2}}>
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
                <Box sx={{borderTop: `1px solid ${C.line}`, pt: 2, display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2}}>
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


export default function RiskRegistryPage() {
    const {enqueueSnackbar} = useSnackbar();
    const userState = useAppSelector((state) => state.user);
    const isLoaded = userState?.isLoaded;
    const isRoot = !!userState?.is_superuser;

    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [treatmentFilter, setTreatmentFilter] = useState('');
    const [orgFilter, setOrgFilter] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [ordering, setOrdering] = useState('-created_at');

    const [paginationModel, setPaginationModel] = useState({page: 0, pageSize: 10});

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [detailRow, setDetailRow] = useState(null);

    useEffect(() => {
        if (!isRoot) return;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATION.LIST);
                setOrganizations(res.data || []);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            }
        })();
    }, [isRoot, enqueueSnackbar]);

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (levelFilter) params.set('risk_level', levelFilter);
        if (treatmentFilter) params.set('treatment_option', treatmentFilter);
        if (isRoot && orgFilter) params.set('organization', orgFilter);
        if (ordering) params.set('ordering', ordering);
        params.set('page', String(paginationModel.page + 1));
        params.set('page_size', String(paginationModel.pageSize));
        return params.toString();
    }, [search, levelFilter, treatmentFilter, isRoot, orgFilter, ordering, paginationModel]);

    const treatmentLabel = useMemo(() => {
        const map = {};
        TREATMENT_OPTIONS.forEach((o) => (map[o.value] = o.label));
        return map;
    }, []);

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
        const t = setTimeout(() => setPaginationModel((p) => ({...p, page: 0})), 300);
        return () => clearTimeout(t);
    }, [search]);

    function handleSortModelChange(model) {
        if (!model || model.length === 0) {
            setOrdering('-created_at');
            return;
        }
        const {field, sort} = model[0];
        const drfField = SORT_FIELD_MAP[field] || field;
        setOrdering(sort === 'desc' ? `-${drfField}` : drfField);
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

    const columns = useMemo(() => {
        const cols = [
            {
                field: 'designation',
                headerName: 'Təyinat',
                flex: 2.2,
                minWidth: 220,
                sortable: true,
            },
        ];
        cols.push({
            field: 'inventory', headerName: 'İnventar', flex: 1, minWidth: 160, sortable: false,
            renderCell: (p) => (
                <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                    {p.value ? `${p.value.inventory_number} — ${p.value.product_name}` : '—'}
                </Typography>
            ),
        });
        if (isRoot) {
            cols.push({
                field: 'organization', headerName: 'Qurum', flex: 1, minWidth: 160,
                valueGetter: (value, row) => row?.organization?.title || '—',
            });
        }
        cols.push(
            {
                field: 'risk_degree',
                headerName: 'Dərəcə',
                width: 90,
                sortable: true,
                align: 'center',
                headerAlign: 'center',
                renderCell: (params) => (
                    <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 13, color: C.inkMuted}}>
                        {params.value}
                    </Typography>
                ),
            },
            {
                field: 'risk_level',
                headerName: 'Səviyyə',
                width: 130,
                sortable: false,
                align: 'center',
                headerAlign: 'center',
                renderCell: (params) => {
                    const level = LEVEL_COLORS[params.value] || LEVEL_COLORS.low;
                    const meta = RISK_LEVEL_META[params.value] || RISK_LEVEL_META.low;
                    return (
                        <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: '3px', backgroundColor: level.bg, border: `1px solid ${level.ring}`}}>
                            <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: level.fg, flexShrink: 0}}/>
                            <Typography sx={{fontSize: 11, color: level.fg, fontWeight: 500, whiteSpace: 'nowrap'}}>{meta.label}</Typography>
                        </Box>
                    );
                },
            },
            {
                field: 'treatment_option',
                headerName: 'Emal variantı',
                flex: 1.3,
                minWidth: 150,
                sortable: false,
                renderCell: (params) => (
                    <Typography sx={{fontSize: 13, color: C.inkMuted}}>
                        {treatmentLabel[params.value] || params.value}
                    </Typography>
                ),
            },
            {
                field: 'created_by',
                headerName: 'Yaradan',
                flex: 1.1,
                minWidth: 140,
                sortable: false,
                renderCell: (params) => {
                    const creatorName = params.value?.name || params.value?.username || '—';
                    return (
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
                    );
                },
            },
            {
                field: 'updated_at',
                headerName: 'Son dəyişiklik',
                width: 160,
                sortable: true,
                renderCell: (params) => (
                    <Typography sx={{fontFamily: 'var(--font-mono)', fontSize: 12, color: C.inkFaint}}>
                        {params.value ? new Date(params.value).toLocaleString('az-AZ') : '—'}
                    </Typography>
                ),
            },
            {
                field: 'actions',
                headerName: '',
                width: 120,
                sortable: false,
                filterable: false,
                disableColumnMenu: true,
                renderCell: (params) => (
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 0.25}}>
                        <Tooltip title="Ətraflı bax">
                            <IconButton size="small" onClick={() => setDetailRow(params.row)} sx={{color: C.inkFaint}}>
                                <VisibilityOutlinedIcon sx={{fontSize: 17}}/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Redaktə et">
                            <IconButton size="small" onClick={() => openEdit(params.row)} sx={{color: C.inkFaint}}>
                                <EditOutlinedIcon sx={{fontSize: 17}}/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                            <IconButton size="small" onClick={() => setDeleteTarget(params.row)} sx={{color: '#A23B3B'}}>
                                <DeleteOutlineIcon sx={{fontSize: 17}}/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
        );
        return cols;
    }, [treatmentLabel, isRoot]);

    if (!isLoaded) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg}}>
                <CircularProgress size={22} sx={{color: C.gold}}/>
            </Box>
        );
    }

    return (
        <Box sx={{minHeight: '100vh', backgroundColor: C.bg, px: {xs: 2, md: 5}, pt: {xs: 3, sm: 4}, pb: 5}}>
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
                <Box sx={{mb: 3, pb: 2.5, borderBottom: `1px solid ${C.line}`}}>
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2}}>
                        <Typography sx={{fontSize: 13, color: C.inkMuted}}>
                            <Box component="span" sx={{color: C.ink, fontWeight: 700}}>{count}</Box> risk qeydi tapıldı
                        </Typography>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon/>}
                            onClick={openCreate}
                            sx={{
                                backgroundColor: C.ink,
                                color: C.bg,
                                textTransform: 'none',
                                fontSize: 13.5,
                                fontWeight: 500,
                                borderRadius: '4px',
                                boxShadow: 'none',
                                px: 2.5,
                                py: 1,
                                '&:hover': {
                                    backgroundColor: C.gold,
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            Risk yarat
                        </Button>
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
                        onChange={(e) => {setLevelFilter(e.target.value); setPaginationModel((p) => ({...p, page: 0}));}}
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
                        onChange={(e) => {setTreatmentFilter(e.target.value); setPaginationModel((p) => ({...p, page: 0}));}}
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
                    {isRoot && (
                        <TextField
                            select size="small" value={orgFilter}
                            onChange={(e) => {setOrgFilter(e.target.value); setPaginationModel((p) => ({...p, page: 0}));}}
                            SelectProps={{
                                displayEmpty: true,
                                renderValue: (v) => organizations.find((o) => o.id === v)?.title || 'Bütün qurumlar',
                                sx: {
                                    color: C.ink, fontSize: 13, backgroundColor: C.surface, borderRadius: '4px',
                                    '& .MuiOutlinedInput-notchedOutline': {borderColor: C.line},
                                },
                                MenuProps: {PaperProps: {sx: {backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`}}},
                            }}
                            sx={{minWidth: 200, '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: C.lineStrong}}}
                        >
                            <MenuItem value="" sx={{color: C.ink, fontSize: 13}}>Bütün qurumlar</MenuItem>
                            {organizations.map((o) => (
                                <MenuItem key={o.id} value={o.id} sx={{color: C.ink, fontSize: 13}}>{o.title}</MenuItem>
                            ))}
                        </TextField>
                    )}
                </Box>

                {/* DataGrid */}
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
                        pageSizeOptions={[10, 20, 50]}
                        disableRowSelectionOnClick
                        disableColumnFilter
                        density="comfortable"
                        localeText={{...DATA_GRID_LOCALE_AZ, noRowsLabel: 'Heç bir qeyd tapılmadı'}}
                        sx={gridSx}
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
                    <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 500, mb: 1}}>
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