"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import GlobalStyles from '@mui/material/GlobalStyles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {DATA_GRID_LOCALE_AZ} from "@/lib/dataGridLocaleAz";
import AttendancePermissionFormDialog from "./AttendancePermissionFormDialog";
import AttendancePermissionReviewDialog from "./AttendancePermissionReviewDialog";

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
    pending: {label: 'Gözləmədə', fg: '#8A7A2E', bg: 'rgba(138,122,46,0.1)'},
    approved: {label: 'Təsdiqlənib', fg: '#2F6B4F', bg: 'rgba(47,107,79,0.1)'},
    rejected: {label: 'Rədd edilib', fg: '#A23B3B', bg: 'rgba(162,59,59,0.1)'},
};

const STATUS_FILTERS = [
    {value: '', label: 'Bütün statuslar'},
    {value: 'pending', label: 'Gözləmədə'},
    {value: 'approved', label: 'Təsdiqlənib'},
    {value: 'rejected', label: 'Rədd edilib'},
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

export default function AttendancePermissionsPage() {
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);

    // Aparat rəhbəri (və ya superuser) sorğu yarada bilmir - yalnız təsdiq/rədd edir.
    const canCreate = !(user?.is_apparatus_head && !user?.is_superuser);
    // Şöbə müdiri / aparat rəhbəri / superuser üçün "kim" və "hansı departament" sütunları mənalıdır.
    const showScopeColumns = !!(user?.is_department_manager || user?.is_apparatus_head || user?.is_superuser);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [reviewTarget, setReviewTarget] = useState(null);
    const [reviewAction, setReviewAction] = useState(null);
    const [reviewing, setReviewing] = useState(false);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            const query = params.toString();
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LIST}${query ? `?${query}` : ''}`);
            setRows(res.data || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [statusFilter, enqueueSnackbar]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const filteredRows = useMemo(() => {
        if (!search) return rows;
        const term = search.toLowerCase();
        return rows.filter((r) =>
            [r.user_name, r.location, r.department_name, r.reason].filter(Boolean).some((v) => v.toLowerCase().includes(term))
        );
    }, [rows, search]);

    async function handleCreate(form) {
        setSaving(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LIST, form);
            enqueueSnackbar('İcazə sorğusu göndərildi.', {variant: 'success'});
            setFormOpen(false);
            fetchRows();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    async function handleReviewConfirm(action, comment) {
        if (!reviewTarget) return;
        setReviewing(true);
        try {
            await service_api.patch(`${NEXT_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.REVIEW}${reviewTarget.id}/review/`, {
                action, comment,
            });
            enqueueSnackbar(action === 'approve' ? 'İcazə təsdiqləndi.' : 'İcazə rədd edildi.', {variant: 'success'});
            setReviewTarget(null);
            setReviewAction(null);
            fetchRows();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setReviewing(false);
        }
    }

    const columns = useMemo(() => {
        const cols = [
            {field: 'date', headerName: 'Tarix', width: 110},
            {
                field: 'time_range', headerName: 'Saat', width: 110, sortable: false,
                valueGetter: (value, row) => `${row.start_time?.slice(0, 5)}–${row.end_time?.slice(0, 5)}`,
            },
            {field: 'location', headerName: 'Yer', flex: 1, minWidth: 160},
        ];

        if (showScopeColumns) {
            cols.push(
                {field: 'user_name', headerName: 'İstifadəçi', flex: 1, minWidth: 160},
                {field: 'department_name', headerName: 'Departament', flex: 1, minWidth: 160},
            );
        }

        cols.push(
            {field: 'reason', headerName: 'Səbəb', flex: 1, minWidth: 160},
            {
                field: 'status', headerName: 'Status', width: 140, align: 'center', headerAlign: 'center',
                renderCell: (params) => {
                    const meta = STATUS_META[params.value] || STATUS_META.pending;
                    return <Chip label={meta.label} size="small" sx={{backgroundColor: meta.bg, color: meta.fg, fontWeight: 500}}/>;
                },
            },
            {
                field: 'reviewed_by_name', headerName: 'Baxan', width: 150,
                valueGetter: (value, row) => row.reviewed_by_name || '—',
            },
            {
                field: 'actions', headerName: '', width: 110, sortable: false, filterable: false, disableColumnMenu: true,
                renderCell: (params) => {
                    if (!params.row.can_review) return null;
                    return (
                        <Box sx={{display: 'flex', gap: 0.5}}>
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
                        </Box>
                    );
                },
            },
        );
        return cols;
    }, [showScopeColumns]);

    return (
        <Box  sx={{maxWidth: 1440, mx: 'auto',mt:4}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2}}>
                <Typography sx={{fontSize: 14, color: C.inkMuted}}>
                    {user?.is_apparatus_head ? 'Qurumunuzun bütün icazə sorğuları.'
                        : user?.is_department_manager ? 'Departamentinizin icazə sorğuları.'
                            : 'Sizin icazə sorğularınız.'}
                </Typography>
                {canCreate && (
                    <Button variant="contained" startIcon={<AddIcon/>} onClick={() => setFormOpen(true)}
                            sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', borderRadius: '8px', px: 2.5, py: 1, '&:hover': {backgroundColor: C.gold}}}>
                        Yeni icazə sorğusu
                    </Button>
                )}
            </Box>

            <Box sx={{display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center'}}>
                <TextField
                    size="small" placeholder="Axtarış..." value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>}}
                    sx={{minWidth: 240}}
                />
                <TextField
                    select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    SelectProps={{displayEmpty: true, renderValue: (v) => STATUS_FILTERS.find((o) => o.value === v)?.label || 'Bütün statuslar'}}
                    sx={{minWidth: 190}}
                >
                    {STATUS_FILTERS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Box sx={{height: {xs: 480, sm: 560, md: 640}, width: '100%'}}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading}
                    disableRowSelectionOnClick
                    disableColumnFilter
                    density="comfortable"
                    localeText={{...DATA_GRID_LOCALE_AZ, noRowsLabel: 'Heç bir icazə sorğusu tapılmadı'}}
                    sx={gridSx}
                />
            </Box>

            <AttendancePermissionFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleCreate}
                loading={saving}
            />

            <AttendancePermissionReviewDialog
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