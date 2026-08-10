"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {DATA_GRID_LOCALE_AZ} from "@/lib/dataGridLocaleAz";
import OperationReviewDialog from "./OperationReviewDialog";
import OperationDetailDialog from "./OperationDetailDialog";

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
};

const STATUS_META = {
    completed: {label: 'Tamamlandı', fg: '#2B5E8C', bg: 'rgba(43,94,140,0.1)'},
    pending: {label: 'Gözləmədə', fg: '#8A7A2E', bg: 'rgba(138,122,46,0.1)'},
    in_progress: {label: 'Baxılır', fg: '#8A5A2E', bg: 'rgba(138,90,46,0.1)'},
    approved: {label: 'Təsdiqləndi', fg: '#2F6B4F', bg: 'rgba(47,107,79,0.1)'},
    rejected: {label: 'Rədd edildi', fg: '#A23B3B', bg: 'rgba(162,59,59,0.1)'},
    canceled: {label: 'Ləğv edildi', fg: C.inkMuted, bg: C.surfaceRaised},
};

const ACTION_META = {
    created: {label: 'Yaratdı', fg: '#2F6B4F', bg: 'rgba(47,107,79,0.08)'},
    updated: {label: 'Redaktə etdi', fg: '#2B5E8C', bg: 'rgba(43,94,140,0.08)'},
    deleted: {label: 'Sildi', fg: '#A23B3B', bg: 'rgba(162,59,59,0.08)'},
    exported: {label: 'İxrac etdi', fg: '#6B4E8C', bg: 'rgba(107,78,140,0.08)'},
    requested: {label: 'Sorğu göndərdi', fg: '#8A7A2E', bg: 'rgba(138,122,46,0.08)'},
    reviewed: {label: 'Baxdı', fg: '#8A5A2E', bg: 'rgba(138,90,46,0.08)'},
};

const TYPE_FILTERS = [
    {value: '', label: 'Bütün tiplər'},
    {value: 'crud', label: 'CRUD əməliyyatları'},
    {value: 'approval', label: 'Təsdiq tələb edənlər'},
];

const STATUS_FILTERS = [
    {value: '', label: 'Bütün statuslar'},
    ...Object.entries(STATUS_META).map(([value, meta]) => ({value, label: meta.label})),
];

const gridSx = {
    border: `1px solid ${C.line}`,
    borderRadius: '4px',
    backgroundColor: C.surface,
    '& .MuiDataGrid-columnHeaders': {backgroundColor: C.surface, borderBottom: `1px solid ${C.lineStrong}`},
    '& .MuiDataGrid-columnHeaderTitle': {fontSize: 11, letterSpacing: '0.05em', color: C.inkFaint, textTransform: 'uppercase', fontWeight: 500},
    '& .MuiDataGrid-cell': {borderBottom: `1px solid ${C.line}`, fontSize: 13.5, color: C.ink, display: 'flex', alignItems: 'center'},
    '& .MuiDataGrid-row:hover': {backgroundColor: 'rgba(0,0,0,0.015)'},
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {outline: 'none'},
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {outline: 'none'},
    '& .MuiDataGrid-footerContainer': {borderTop: `1px solid ${C.line}`},
};

function formatDateTime(v) {
    if (!v) return '—';
    try {
        return new Date(v).toLocaleString('az-AZ');
    } catch {
        return v;
    }
}

export default function OperationsPage() {
    const {enqueueSnackbar} = useSnackbar();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [detailRow, setDetailRow] = useState(null);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewAction, setReviewAction] = useState(null);
    const [reviewing, setReviewing] = useState(false);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (typeFilter) params.set('operation_type', typeFilter);
            if (statusFilter) params.set('status', statusFilter);
            if (search) params.set('search', search);
            const query = params.toString();
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.OPERATIONS.LIST}${query ? `?${query}` : ''}`);
            setRows(res.data?.results || res.data || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [typeFilter, statusFilter, search, enqueueSnackbar]);

    useEffect(() => {
        const timeout = setTimeout(fetchRows, search ? 350 : 0);
        return () => clearTimeout(timeout);
    }, [fetchRows]);

    async function handleReviewConfirm(action, comment) {
        if (!reviewTarget) return;
        setReviewing(true);
        try {
            await service_api.patch(`${NEXT_API_ENDPOINTS.OPERATIONS.REVIEW}${reviewTarget.id}/review/`, {
                action, comment,
            });
            enqueueSnackbar(action === 'approve' ? 'Əməliyyat təsdiqləndi.' : 'Əməliyyat rədd edildi.', {variant: 'success'});
            setReviewTarget(null);
            setReviewAction(null);
            fetchRows();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setReviewing(false);
        }
    }

    const columns = useMemo(() => [
        {
            field: 'created_at', headerName: 'Tarix', width: 160,
            valueGetter: (value, row) => formatDateTime(row.created_at),
        },
        {field: 'category_title', headerName: 'Kateqoriya', flex: 1, minWidth: 150},
        {
            field: 'action', headerName: 'Hərəkət', width: 150,
            renderCell: (params) => {
                const meta = ACTION_META[params.value] || {label: params.row.action_display, fg: C.inkMuted, bg: C.surfaceRaised};
                return <Chip label={params.row.action_display || meta.label} size="small" sx={{backgroundColor: meta.bg, color: meta.fg, fontWeight: 500}}/>;
            },
        },
        {
            field: 'status', headerName: 'Status', width: 160,
            renderCell: (params) => {
                const meta = STATUS_META[params.value] || STATUS_META.completed;
                const step = params.row.operation_type === 'approval' && params.row.total_steps
                    ? ` (${params.row.current_step}/${params.row.total_steps})` : '';
                return <Chip label={`${params.row.status_display || meta.label}${step}`} size="small" sx={{backgroundColor: meta.bg, color: meta.fg, fontWeight: 500}}/>;
            },
        },
        // {field: 'object_repr', headerName: 'Obyekt', flex: 1.3, minWidth: 200},
        {
            field: 'user_name', headerName: 'İstifadəçi', width: 160,
            valueGetter: (value, row) => row.user_name || row.user_username_snapshot || '—',
        },
        {
            field: 'actions', headerName: '', width: 120, sortable: false, filterable: false, disableColumnMenu: true,
            renderCell: (params) => (
                <Box sx={{display: 'flex', gap: 0.5}}>
                    <Tooltip title="Ətraflı">
                        <IconButton size="small" onClick={() => setDetailRow(params.row)}>
                            <VisibilityOutlinedIcon fontSize="small" sx={{color: C.inkMuted}}/>
                        </IconButton>
                    </Tooltip>
                    {params.row.can_review && (
                        <>
                            <Tooltip title="Təsdiqlə">
                                <IconButton size="small" onClick={() => {
                                    setReviewTarget(params.row);
                                    setReviewAction('approve');
                                }} sx={{color: '#2F6B4F'}}>
                                    <CheckCircleOutlineIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Rədd et">
                                <IconButton size="small" onClick={() => {
                                    setReviewTarget(params.row);
                                    setReviewAction('reject');
                                }} sx={{color: '#A23B3B'}}>
                                    <HighlightOffIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            ),
        },
    ], []);

    return (
        <Box sx={{maxWidth: 1440, mx: 'auto', mt: 4}}>
            {/*<Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2}}>*/}
            {/*    <Typography sx={{fontSize: 14, color: C.inkMuted}}>*/}
            {/*        Bütün modullarda baş vermiş əməliyyatların (CRUD + təsdiq axını) mərkəzi reyestri.*/}
            {/*    </Typography>*/}
            {/*</Box>*/}

            <Box sx={{display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center'}}>
                <TextField
                    size="small" placeholder="Axtarış..." value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>}}
                    sx={{minWidth: 240}}
                />
                <TextField
                    select size="small" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                    sx={{minWidth: 200}}
                >
                    {TYPE_FILTERS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{minWidth: 190}}
                >
                    {STATUS_FILTERS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Box sx={{height: {xs: 480, sm: 560, md: 640}, width: '100%'}}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading}
                    disableRowSelectionOnClick
                    disableColumnFilter
                    density="comfortable"
                    localeText={{...DATA_GRID_LOCALE_AZ, noRowsLabel: 'Heç bir əməliyyat tapılmadı'}}
                    sx={gridSx}
                />
            </Box>

            <OperationDetailDialog row={detailRow} onClose={() => setDetailRow(null)}/>

            <OperationReviewDialog
                target={reviewTarget}
                action={reviewAction}
                onClose={() => {
                    setReviewTarget(null);
                    setReviewAction(null);
                }}
                onConfirm={handleReviewConfirm}
                loading={reviewing}
            />
        </Box>
    );
}