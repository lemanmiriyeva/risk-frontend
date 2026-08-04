"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {DATA_GRID_LOCALE_AZ} from "@/lib/dataGridLocaleAz";

const C = {
    surface: '#FFFFFF',
    surfaceRaised: '#FBFAF6',
    line: '#E4E1D8',
    lineStrong: '#D0CCC0',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    gold: '#9C7A2E',
    goldTint: 'rgba(156,122,46,0.1)',
};

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

const dialogPaperSx = {
    backgroundColor: C.surface,
    backgroundImage: 'none',
    borderRadius: '14px',
    boxShadow: '0 20px 60px rgba(29,27,22,0.18)',
    border: `1px solid ${C.line}`,
};

const fieldSx = {
    '& .MuiOutlinedInput-root': {borderRadius: '8px'},
};

const EMPTY_FORM = {
    title: '', short_name: '', is_active: true,
    authorized_person_name: '', authorized_person_position: '',
};

function initials(title) {
    const parts = (title || '?').trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (title || '?').slice(0, 2).toUpperCase();
}

function OrgFormDialog({open, onClose, onSubmit, initialData, loading}) {
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (initialData) {
            setForm({
                title: initialData.title || '',
                short_name: initialData.short_name || '',
                is_active: !!initialData.is_active,
                authorized_person_name: initialData.authorized_person_name || '',
                authorized_person_position: initialData.authorized_person_position || '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [initialData, open]);

    const isEdit = !!initialData;

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
                PaperProps={{sx: dialogPaperSx, component: 'form', onSubmit: handleSubmit}}>
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(180deg, ${C.surfaceRaised}, ${C.surface})`, borderBottom: `1px solid ${C.line}`}}>
                <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 600}}>
                    {isEdit ? 'Qurumu redaktə et' : 'Yeni qurum'}
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2}}>
                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField label="Qurumun adı" required fullWidth size="small" sx={fieldSx}
                               value={form.title} onChange={(e) => set('title', e.target.value)}/>
                    <TextField label="Qısaltma" fullWidth size="small" sx={{...fieldSx, maxWidth: 140}}
                               value={form.short_name} onChange={(e) => set('short_name', e.target.value)}/>
                </Box>

                <Box sx={{
                    mt: 0.5, p: 2, borderRadius: '10px', border: `1px solid ${C.line}`, backgroundColor: C.surfaceRaised,
                    display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                    <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.75}}>
                        <BadgeOutlinedIcon sx={{fontSize: 15}}/> Səlahiyyətli şəxs
                    </Typography>
                    <TextField label="Adı Soyadı" required fullWidth size="small" sx={fieldSx}
                               value={form.authorized_person_name}
                               onChange={(e) => set('authorized_person_name', e.target.value)}/>
                    <TextField label="Vəzifəsi" fullWidth size="small" sx={fieldSx}
                               value={form.authorized_person_position}
                               onChange={(e) => set('authorized_person_position', e.target.value)}/>
                </Box>

                <FormControlLabel
                    control={<Switch checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)}/>}
                    label="Aktivdir"
                />
            </Box>

            <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: `1px solid ${C.line}`, pt: 2}}>
                <Button onClick={onClose} disabled={loading} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                <Button type="submit" variant="contained" disabled={loading}
                        sx={{backgroundColor: C.ink, color: '#fff', textTransform: 'none', boxShadow: 'none', borderRadius: '8px', px: 3, '&:hover': {backgroundColor: C.gold}}}>
                    {loading ? <CircularProgress size={18} sx={{color: '#fff'}}/> : (isEdit ? 'Yadda saxla' : 'Yarat')}
                </Button>
            </Box>
        </Dialog>
    );
}

function OrgDetailDialog({open, onClose, orgId}) {
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !orgId) return;
        (async () => {
            setLoading(true);
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATION.LIST}${orgId}/`);
                setData(res.data);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            } finally {
                setLoading(false);
            }
        })();
    }, [open, orgId, enqueueSnackbar]);

    const employeeColumns = useMemo(() => [
        {field: 'name', headerName: 'Ad Soyad', flex: 1.2, minWidth: 150},
        {field: 'email', headerName: 'Email', flex: 1.3, minWidth: 180},
        {
            field: 'role_name', headerName: 'Vəzifə', flex: 1, minWidth: 130,
            valueGetter: (value, row) => row?.role_name || '—',
        },
        {
            field: 'department_name', headerName: 'Departament', flex: 1, minWidth: 130,
            valueGetter: (value, row) => row?.department_name || '—',
        },
    ], []);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{sx: dialogPaperSx}}>
            <Box sx={{px: 3, pt: 3, pb: 2.5, display: 'flex', alignItems: 'center', gap: 2, background: `linear-gradient(180deg, ${C.surfaceRaised}, ${C.surface})`, borderBottom: `1px solid ${C.line}`}}>
                <Avatar variant="rounded" sx={{width: 48, height: 48, borderRadius: '10px', backgroundColor: C.goldTint, color: C.gold, fontWeight: 600, fontSize: 16}}>
                    {initials(data?.title)}
                </Avatar>
                <Box sx={{flex: 1, minWidth: 0}}>
                    <Typography sx={{fontSize: 16, color: C.ink, fontWeight: 600, lineHeight: 1.3}}>
                        {data?.title || 'Qurum'}
                    </Typography>
                    {data?.short_name && (
                        <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>{data.short_name}</Typography>
                    )}
                </Box>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            {loading || !data ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                    <CircularProgress size={22}/>
                </Box>
            ) : (
                <Box sx={{px: 3, py: 2.5}}>
                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mb: 3}}>
                        <Box sx={{p: 2, border: `1px solid ${C.line}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: C.surfaceRaised}}>
                            <Box sx={{width: 40, height: 40, borderRadius: '10px', backgroundColor: C.goldTint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold}}>
                                <PersonOutlineIcon/>
                            </Box>
                            <Box>
                                <Typography sx={{fontSize: 20, fontWeight: 700, color: C.ink, lineHeight: 1}}>
                                    {data.employee_count ?? 0}
                                </Typography>
                                <Typography sx={{fontSize: 12, color: C.inkFaint}}>İşçi sayı</Typography>
                            </Box>
                        </Box>
                        <Box sx={{p: 2, border: `1px solid ${C.line}`, borderRadius: '10px', backgroundColor: C.surfaceRaised, display: 'flex', alignItems: 'center', gap: 1.5}}>
                            <Box sx={{width: 40, height: 40, borderRadius: '10px', backgroundColor: C.goldTint, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gold, flexShrink: 0}}>
                                <BadgeOutlinedIcon/>
                            </Box>
                            <Box sx={{minWidth: 0}}>
                                <Typography sx={{fontSize: 12, color: C.inkFaint}}>Səlahiyyətli şəxs</Typography>
                                <Typography sx={{fontSize: 13.5, color: C.ink, fontWeight: 600, wordBreak: 'break-word'}}>
                                    {data.authorized_person_name || '—'}
                                </Typography>
                                {data.authorized_person_position && (
                                    <Typography sx={{fontSize: 12, color: C.inkMuted}}>
                                        {data.authorized_person_position}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{mb: 2, borderColor: C.line}}/>
                    <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.25}}>
                        İşçilər
                    </Typography>
                    <Box sx={{height: 360, width: '100%'}}>
                        <DataGrid
                            rows={data.employees || []}
                            columns={employeeColumns}
                            getRowId={(row) => row.id}
                            disableRowSelectionOnClick
                            disableColumnFilter
                            density="compact"
                            localeText={{...DATA_GRID_LOCALE_AZ, noRowsLabel: 'İşçi tapılmadı'}}
                            sx={gridSx}
                        />
                    </Box>
                </Box>
            )}
        </Dialog>
    );
}

export default function OrganizationsListPage() {
    const {enqueueSnackbar} = useSnackbar();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [saving, setSaving] = useState(false);

    const [detailOrgId, setDetailOrgId] = useState(null);

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATION.LIST);
            setRows(res.data || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    const filteredRows = useMemo(() => {
        if (!search) return rows;
        const term = search.toLowerCase();
        return rows.filter((r) => [r.title, r.short_name].filter(Boolean).some((v) => v.toLowerCase().includes(term)));
    }, [rows, search]);

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
                await service_api.patch(`${NEXT_API_ENDPOINTS.ORGANIZATION.LIST}${editingRow.id}/`, form);
                enqueueSnackbar('Qurum yeniləndi.', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATION.LIST, form);
                enqueueSnackbar('Qurum yaradıldı.', {variant: 'success'});
            }
            setFormOpen(false);
            fetchOrganizations();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    const columns = useMemo(() => [
        {
            field: 'title', headerName: 'Qurumun adı', flex: 1.6, minWidth: 240,
            renderCell: (params) => (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25}}>
                    <Avatar variant="rounded" sx={{width: 30, height: 30, borderRadius: '7px', backgroundColor: C.goldTint, color: C.gold, fontSize: 12, fontWeight: 700}}>
                        {initials(params.value)}
                    </Avatar>
                    <Typography sx={{fontSize: 13.5, color: C.ink, fontWeight: 500}}>{params.value}</Typography>
                </Box>
            ),
        },
        {field: 'short_name', headerName: 'Qısaltma', flex: 0.7, minWidth: 100},
        {
            field: 'authorized_person_name', headerName: 'Səlahiyyətli şəxs', flex: 1.2, minWidth: 160,
            valueGetter: (value, row) => row?.authorized_person_name || '—',
        },
        {
            field: 'employee_count', headerName: 'İşçi sayı', width: 100, align: 'center', headerAlign: 'center',
            valueGetter: (value, row) => row?.employee_count ?? 0,
            renderCell: (params) => (
                <Chip label={params.value} size="small" sx={{backgroundColor: C.goldTint, color: C.gold, fontWeight: 600, minWidth: 32}}/>
            ),
        },
        {
            field: 'is_active', headerName: 'Status', width: 110, align: 'center', headerAlign: 'center',
            renderCell: (params) => params.value
                ? <Chip label="Aktiv" size="small" sx={{backgroundColor: 'rgba(47,107,79,0.1)', color: '#2F6B4F'}}/>
                : <Chip label="Deaktiv" size="small" sx={{backgroundColor: 'rgba(162,59,59,0.1)', color: '#A23B3B'}}/>,
        },
        {
            field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
            renderCell: (params) => (
                <Box sx={{display: 'flex', gap: 0.5}}>
                    <Tooltip title="Ətraflı bax">
                        <IconButton size="small" onClick={() => setDetailOrgId(params.row.id)} sx={{color: C.inkMuted}}>
                            <VisibilityOutlinedIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Redaktə et">
                        <IconButton size="small" onClick={() => openEdit(params.row)} sx={{color: C.inkMuted}}>
                            <EditOutlinedIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ], []);

    return (
        <Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25}}>
                    <Box sx={{width: 34, height: 34, borderRadius: '9px', backgroundColor: C.goldTint, color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <ApartmentOutlinedIcon fontSize="small"/>
                    </Box>
                    <Typography sx={{fontSize: 14, color: C.inkMuted}}>
                        Sistemdəki bütün qurumlar. Yeni qurum yaradın və ya mövcud olanı redaktə edin.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={openCreate}
                        sx={{backgroundColor: C.ink, color: '#fff', textTransform: 'none', boxShadow: 'none', borderRadius: '8px', px: 2.5, py: 1, '&:hover': {backgroundColor: C.gold}}}>
                    Yeni qurum
                </Button>
            </Box>

            <TextField
                size="small" placeholder="Axtarış..." value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>}}
                sx={{minWidth: 240, mb: 2, ...fieldSx}}
            />

            <Box sx={{height: {xs: 480, sm: 560, md: 600}, width: '100%'}}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading}
                    disableRowSelectionOnClick
                    disableColumnFilter
                    density="comfortable"
                    localeText={{...DATA_GRID_LOCALE_AZ, noRowsLabel: 'Heç bir qurum tapılmadı'}}
                    sx={gridSx}
                />
            </Box>

            <OrgFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingRow}
                loading={saving}
            />

            <OrgDetailDialog
                open={!!detailOrgId}
                onClose={() => setDetailOrgId(null)}
                orgId={detailOrgId}
            />
        </Box>
    );
}