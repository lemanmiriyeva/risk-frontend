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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MailLockOutlinedIcon from '@mui/icons-material/MailLockOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
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

const EMPTY_FORM = {
    username: '', email: '', firstname: '', lastname: '', phone_number: '',
    is_active: true, is_org_admin: false, organization: '',
};

function UserFormDialog({open, onClose, onSubmit, initialData, loading, isRoot, organizations}) {
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (initialData) {
            setForm({
                username: initialData.username || '',
                email: initialData.email || '',
                firstname: initialData.firstname || '',
                lastname: initialData.lastname || '',
                phone_number: initialData.phone_number || '',
                is_active: !!initialData.is_active,
                is_org_admin: !!initialData.is_org_admin,
                organization: initialData.organization?.id || '',
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
                PaperProps={{sx: {backgroundColor: C.surface, backgroundImage: 'none', border: `1px solid ${C.line}`, borderRadius: '4px'}, component: 'form', onSubmit: handleSubmit}}>
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`}}>
                <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 500}}>
                    {isEdit ? 'İstifadəçini redaktə et' : 'Yeni istifadəçi'}
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2}}>
                {!isEdit && (
                    <TextField label="İstifadəçi adı" required fullWidth size="small"
                               value={form.username} onChange={(e) => set('username', e.target.value)}/>
                )}
                <TextField label="Email" type="email" required fullWidth size="small"
                           value={form.email} onChange={(e) => set('email', e.target.value)}/>
                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField label="Ad" fullWidth size="small"
                               value={form.firstname} onChange={(e) => set('firstname', e.target.value)}/>
                    <TextField label="Soyad" fullWidth size="small"
                               value={form.lastname} onChange={(e) => set('lastname', e.target.value)}/>
                </Box>
                <TextField label="Telefon nömrəsi" fullWidth size="small"
                           value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)}/>

                {isRoot && !isEdit && (
                    <TextField select label="Qurum" required fullWidth size="small"
                               value={form.organization} onChange={(e) => set('organization', e.target.value)}>
                        {organizations.map((o) => (
                            <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>
                        ))}
                    </TextField>
                )}

                <FormControlLabel
                    control={<Switch checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)}/>}
                    label="Aktivdir"
                />
                {isRoot && (
                    <FormControlLabel
                        control={<Switch checked={form.is_org_admin} onChange={(e) => set('is_org_admin', e.target.checked)}/>}
                        label="Qurum admini"
                    />
                )}

                {!isEdit && (
                    <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>
                        Şifrə burada təyin edilmir - sistem təsadüfi şifrə yaradıb birbaşa istifadəçinin email
                        ünvanına göndərəcək.
                    </Typography>
                )}
            </Box>

            <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: `1px solid ${C.line}`, pt: 2}}>
                <Button onClick={onClose} disabled={loading} sx={{color: C.inkMuted}}>İmtina</Button>
                <Button type="submit" variant="contained" disabled={loading}
                        sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', '&:hover': {backgroundColor: C.gold}}}>
                    {loading ? <CircularProgress size={18} sx={{color: '#fff'}}/> : (isEdit ? 'Yadda saxla' : 'Yarat')}
                </Button>
            </Box>
        </Dialog>
    );
}

export default function OrgAdminUsersPage() {
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const isOrgAdmin = !!user?.is_org_admin;

    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [saving, setSaving] = useState(false);

    const [resetTarget, setResetTarget] = useState(null);
    const [resetting, setResetting] = useState(false);

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

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const query = isRoot && selectedOrg ? `?organization=${selectedOrg}` : '';
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATION.USERS}${query}`);
            setRows(res.data || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [isRoot, selectedOrg, enqueueSnackbar]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredRows = useMemo(() => {
        if (!search) return rows;
        const term = search.toLowerCase();
        return rows.filter((r) =>
            [r.username, r.name, r.email, r.organization?.title].filter(Boolean).some((v) => v.toLowerCase().includes(term))
        );
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
                const {username, organization, ...payload} = form;
                await service_api.patch(`${NEXT_API_ENDPOINTS.ORGANIZATION.USERS}${editingRow.id}/`, payload);
                enqueueSnackbar('İstifadəçi yeniləndi.', {variant: 'success'});
            } else {
                const query = isRoot && form.organization ? `?organization=${form.organization}` : '';
                const res = await service_api.post(`${NEXT_API_ENDPOINTS.ORGANIZATION.USERS}${query}`, form);
                if (res.data?._warning) {
                    enqueueSnackbar(res.data._warning, {variant: 'warning'});
                } else {
                    enqueueSnackbar('İstifadəçi yaradıldı, giriş məlumatları email ilə göndərildi.', {variant: 'success'});
                }
            }
            setFormOpen(false);
            fetchUsers();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    async function handleResetConfirm() {
        if (!resetTarget) return;
        setResetting(true);
        try {
            await service_api.post(`${NEXT_API_ENDPOINTS.ORGANIZATION.USERS}${resetTarget.id}/reset-password/`, {});
            enqueueSnackbar('Yeni şifrə istifadəçinin email ünvanına göndərildi.', {variant: 'success'});
            setResetTarget(null);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setResetting(false);
        }
    }

    const columns = useMemo(() => {
        const cols = [
            {field: 'username', headerName: 'İstifadəçi adı', flex: 1, minWidth: 140},
            {field: 'name', headerName: 'Ad Soyad', flex: 1.2, minWidth: 160},
            {field: 'email', headerName: 'Email', flex: 1.4, minWidth: 200},
        ];
        if (isRoot) {
            cols.push({
                field: 'organization', headerName: 'Qurum', flex: 1, minWidth: 160,
                valueGetter: (params) => params.row.organization?.title || '—',
            });
        }
        cols.push(
            {
                field: 'is_org_admin', headerName: 'Qurum admini', width: 130, align: 'center', headerAlign: 'center',
                renderCell: (params) => params.value
                    ? <Chip label="Bəli" size="small" sx={{backgroundColor: 'rgba(47,107,79,0.1)', color: '#2F6B4F'}}/>
                    : <Chip label="Xeyr" size="small" sx={{backgroundColor: 'rgba(0,0,0,0.05)', color: C.inkMuted}}/>,
            },
            {
                field: 'is_active', headerName: 'Status', width: 110, align: 'center', headerAlign: 'center',
                renderCell: (params) => params.value
                    ? <Chip label="Aktiv" size="small" sx={{backgroundColor: 'rgba(47,107,79,0.1)', color: '#2F6B4F'}}/>
                    : <Chip label="Deaktiv" size="small" sx={{backgroundColor: 'rgba(162,59,59,0.1)', color: '#A23B3B'}}/>,
            },
            {
                field: 'actions', headerName: '', width: 110, sortable: false, filterable: false, disableColumnMenu: true,
                renderCell: (params) => (
                    <Box sx={{display: 'flex', gap: 0.5}}>
                        <Tooltip title="Redaktə et">
                            <IconButton size="small" onClick={() => openEdit(params.row)} sx={{color: C.inkMuted}}>
                                <EditOutlinedIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Yeni şifrə göndər">
                            <IconButton size="small" onClick={() => setResetTarget(params.row)} sx={{color: C.inkMuted}}>
                                <MailLockOutlinedIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
        );
        return cols;
    }, [isRoot]);

    if (!isRoot && !isOrgAdmin) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Typography color="text.secondary">Bu bölməyə giriş icazəniz yoxdur.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{p: {xs: 3, md: 6}, maxWidth: '90%', mx: 'auto', minHeight: '100vh'}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2}}>
                <Box>
                    <Typography variant="h4" sx={{fontWeight: 800}}>İnzibatçı paneli</Typography>
                    <Typography variant="subtitle1" color="text.secondary" sx={{mt: 0.5}}>
                        {isRoot ? 'Bütün qurumların istifadəçilərini idarə edin.' : 'Qurumunuzun istifadəçilərini idarə edin.'}
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={openCreate}
                        sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', px: 2.5, py: 1, '&:hover': {backgroundColor: C.gold}}}>
                    Yeni istifadəçi
                </Button>
            </Box>

            <Box sx={{display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center'}}>
                <TextField
                    size="small" placeholder="Axtarış..." value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>}}
                    sx={{minWidth: 240}}
                />
                {isRoot && (
                    <TextField
                        select size="small" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}
                        SelectProps={{displayEmpty: true, renderValue: (v) => organizations.find((o) => o.id === v)?.title || 'Bütün qurumlar'}}
                        sx={{minWidth: 220}}
                    >
                        <MenuItem value="">Bütün qurumlar</MenuItem>
                        {organizations.map((o) => (
                            <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>
                        ))}
                    </TextField>
                )}
            </Box>

            <Box sx={{height: 640, width: '100%'}}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading}
                    disableRowSelectionOnClick
                    disableColumnFilter
                    density="comfortable"
                    localeText={{noRowsLabel: 'Heç bir istifadəçi tapılmadı'}}
                    sx={gridSx}
                />
            </Box>

            <UserFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingRow}
                loading={saving}
                isRoot={isRoot}
                organizations={organizations}
            />

            <Dialog open={!!resetTarget} onClose={() => setResetTarget(null)}
                    PaperProps={{sx: {backgroundColor: C.surface, backgroundImage: 'none', border: `1px solid ${C.line}`, borderRadius: '4px', maxWidth: 440}}}>
                <Box sx={{px: 3, pt: 3, pb: 2}}>
                    <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 500, mb: 1}}>Yeni şifrə göndərilsin?</Typography>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                        "{resetTarget?.name || resetTarget?.username}" üçün sistem yeni təsadüfi şifrə yaradıb birbaşa
                        onun email ünvanına ({resetTarget?.email}) göndərəcək. Şifrəni siz görməyəcəksiniz.
                    </Typography>
                </Box>
                <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                    <Button onClick={() => setResetTarget(null)} disabled={resetting} sx={{color: C.inkMuted}}>İmtina</Button>
                    <Button onClick={handleResetConfirm} disabled={resetting} variant="contained"
                            sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', '&:hover': {backgroundColor: C.gold}}}>
                        {resetting ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Göndər'}
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}