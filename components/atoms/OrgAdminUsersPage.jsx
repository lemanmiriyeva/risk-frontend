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
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MailLockOutlinedIcon from '@mui/icons-material/MailLockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
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
    username: '', email: '', firstname: '', lastname: '', phone_number: '',
    fin_kod: '', role: '', department: '', is_active: true, is_org_admin: false, organization: '',
};

function initials(name, username) {
    const src = (name || '').trim() || username || '?';
    const parts = src.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return src.slice(0, 2).toUpperCase();
}

function flattenDepartments(deps, prefix = '') {
    let result = [];
    (deps || []).forEach((d) => {
        result.push({id: d.id, label: prefix + d.title});
        if (d.children && d.children.length) {
            result = result.concat(flattenDepartments(d.children, prefix + d.title + ' / '));
        }
    });
    return result;
}

function InfoRow({icon, label, value}) {
    return (
        <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.1}}>
            <Box sx={{color: C.inkFaint, mt: 0.2}}>{icon}</Box>
            <Box sx={{flex: 1, minWidth: 0}}>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.2}}>
                    {label}
                </Typography>
                <Typography sx={{fontSize: 14, color: C.ink, fontWeight: 500, wordBreak: 'break-word'}}>
                    {value || '—'}
                </Typography>
            </Box>
        </Box>
    );
}

function UserDetailDialog({open, onClose, data}) {
    if (!data) return null;
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{sx: dialogPaperSx}}>
            <Box sx={{px: 3, pt: 3, pb: 2.5, display: 'flex', alignItems: 'center', gap: 2, background: `linear-gradient(180deg, ${C.surfaceRaised}, ${C.surface})`, borderBottom: `1px solid ${C.line}`}}>
                <Avatar sx={{width: 48, height: 48, backgroundColor: C.goldTint, color: C.gold, fontWeight: 600, fontSize: 16}}>
                    {initials(data.name, data.username)}
                </Avatar>
                <Box sx={{flex: 1, minWidth: 0}}>
                    <Typography sx={{fontSize: 16, color: C.ink, fontWeight: 600, lineHeight: 1.3}}>
                        {data.name || data.username}
                    </Typography>
                    <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>@{data.username}</Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            <Box sx={{px: 3, py: 1, display: 'flex', gap: 1, flexWrap: 'wrap', pt: 2}}>
                <Chip
                    label={data.is_active ? 'Aktiv' : 'Deaktiv'} size="small"
                    sx={{backgroundColor: data.is_active ? 'rgba(47,107,79,0.1)' : 'rgba(162,59,59,0.1)', color: data.is_active ? '#2F6B4F' : '#A23B3B', fontWeight: 500}}
                />
                {data.is_org_admin && (
                    <Chip label="Qurum admini" size="small" sx={{backgroundColor: C.goldTint, color: C.gold, fontWeight: 500}}/>
                )}
            </Box>

            <Box sx={{px: 3, pb: 3, pt: 0.5}}>
                <InfoRow icon={<MailOutlineIcon fontSize="small"/>} label="Email" value={data.email}/>
                <InfoRow icon={<ApartmentOutlinedIcon fontSize="small"/>} label="Qurum" value={data.organization?.title}/>
                <InfoRow icon={<WorkOutlineIcon fontSize="small"/>} label="Vəzifə" value={data.role_name}/>
                <InfoRow icon={<AccountTreeOutlinedIcon fontSize="small"/>} label="Departament" value={data.department_name}/>
                <InfoRow icon={<PhoneOutlinedIcon fontSize="small"/>} label="Telefon nömrəsi" value={data.phone_number}/>
                <InfoRow icon={<CreditCardOutlinedIcon fontSize="small"/>} label="FIN kod" value={data.fin_kod}/>
            </Box>
        </Dialog>
    );
}

function UserFormDialog({open, onClose, onSubmit, initialData, loading, isRoot, organizations, roles, departments}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const flatDepartments = useMemo(() => flattenDepartments(departments), [departments]);

    useEffect(() => {
        if (initialData) {
            setForm({
                username: initialData.username || '',
                email: initialData.email || '',
                firstname: initialData.firstname || '',
                lastname: initialData.lastname || '',
                phone_number: initialData.phone_number || '',
                fin_kod: initialData.fin_kod || '',
                role: initialData.role || '',
                department: initialData.department || '',
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
                PaperProps={{sx: dialogPaperSx, component: 'form', onSubmit: handleSubmit}}>
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(180deg, ${C.surfaceRaised}, ${C.surface})`, borderBottom: `1px solid ${C.line}`}}>
                <Box>
                    <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 600}}>
                        {isEdit ? 'İstifadəçini redaktə et' : 'Yeni istifadəçi'}
                    </Typography>
                    {isEdit && (
                        <Typography sx={{fontSize: 12.5, color: C.inkFaint, mt: 0.3}}>@{initialData.username}</Typography>
                    )}
                </Box>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '65vh', overflowY: 'auto'}}>
                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField label="İstifadəçi adı" required fullWidth size="small" sx={fieldSx}
                               disabled={isEdit}
                               value={form.username} onChange={(e) => set('username', e.target.value)}/>
                    <TextField label="Email" type="email" required fullWidth size="small" sx={fieldSx}
                               disabled={isEdit}
                               value={form.email} onChange={(e) => set('email', e.target.value)}/>
                </Box>
                {isEdit && (
                    <Typography sx={{fontSize: 12, color: C.inkFaint, mt: -1}}>
                        İstifadəçi adı və email redaktə edilə bilmir.
                    </Typography>
                )}

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField label="Ad" fullWidth size="small" sx={fieldSx}
                               value={form.firstname} onChange={(e) => set('firstname', e.target.value)}/>
                    <TextField label="Soyad" fullWidth size="small" sx={fieldSx}
                               value={form.lastname} onChange={(e) => set('lastname', e.target.value)}/>
                </Box>
                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField label="Telefon nömrəsi" fullWidth size="small" sx={fieldSx}
                               value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)}/>
                    <TextField label="FIN kod" fullWidth size="small" sx={fieldSx}
                               value={form.fin_kod} onChange={(e) => set('fin_kod', e.target.value)}/>
                </Box>

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField select label="Vəzifə" fullWidth size="small" sx={fieldSx}
                               value={form.role} onChange={(e) => set('role', e.target.value)}>
                        <MenuItem value="">—</MenuItem>
                        {roles.map((r) => (
                            <MenuItem key={r.id} value={r.id}>{r.title}</MenuItem>
                        ))}
                    </TextField>
                    <TextField select label="Departament/Şöbə" fullWidth size="small" sx={fieldSx}
                               value={form.department} onChange={(e) => set('department', e.target.value)}>
                        <MenuItem value="">—</MenuItem>
                        {flatDepartments.map((d) => (
                            <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                {isRoot && !isEdit && (
                    <TextField select label="Qurum" required fullWidth size="small" sx={fieldSx}
                               value={form.organization} onChange={(e) => set('organization', e.target.value)}>
                        {organizations.map((o) => (
                            <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>
                        ))}
                    </TextField>
                )}

                <Box sx={{display: 'flex', gap: 3, px: 0.5, py: 1, backgroundColor: C.surfaceRaised, borderRadius: '8px', border: `1px solid ${C.line}`}}>
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
                </Box>

                {!isEdit && (
                    <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>
                        Şifrə burada təyin edilmir - sistem təsadüfi şifrə yaradıb birbaşa istifadəçinin email
                        ünvanına göndərəcək.
                    </Typography>
                )}
            </Box>

            <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: `1px solid ${C.line}`, pt: 2}}>
                <Button onClick={onClose} disabled={loading} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                <Button type="submit" variant="contained" disabled={loading}
                        sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', borderRadius: '8px', px: 3, '&:hover': {backgroundColor: C.gold}}}>
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
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [saving, setSaving] = useState(false);

    const [detailTarget, setDetailTarget] = useState(null);
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

    useEffect(() => {
        (async () => {
            try {
                const [rolesRes, deptRes] = await Promise.all([
                    service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.ROLES),
                    service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.DEPARTMENTS),
                ]);
                setRoles(rolesRes.data || []);
                setDepartments(deptRes.data || []);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            }
        })();
    }, [enqueueSnackbar]);

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
            [r.username, r.name, r.email, r.organization?.title, r.role_name].filter(Boolean).some((v) => v.toLowerCase().includes(term))
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
            const payload = {...form, role: form.role || null, department: form.department || null};
            if (editingRow) {
                const {username, email, organization, ...updatePayload} = payload;
                await service_api.patch(`${NEXT_API_ENDPOINTS.ORGANIZATION.USERS}${editingRow.id}/`, updatePayload);
                enqueueSnackbar('İstifadəçi yeniləndi.', {variant: 'success'});
            } else {
                const query = isRoot && form.organization ? `?organization=${form.organization}` : '';
                const res = await service_api.post(`${NEXT_API_ENDPOINTS.ORGANIZATION.USERS}${query}`, payload);
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
            {
                field: 'role_name', headerName: 'Vəzifə', flex: 1, minWidth: 140,
                valueGetter: (value, row) => row?.role_name || '—',
            },
        ];
        if (isRoot) {
            cols.push({
                field: 'organization', headerName: 'Qurum', flex: 1, minWidth: 160,
                valueGetter: (value, row) => row?.organization?.title || '—',
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
                field: 'actions', headerName: '', width: 140, sortable: false, filterable: false, disableColumnMenu: true,
                renderCell: (params) => (
                    <Box sx={{display: 'flex', gap: 0.5}}>
                        <Tooltip title="Ətraflı bax">
                            <IconButton size="small" onClick={() => setDetailTarget(params.row)} sx={{color: C.inkMuted}}>
                                <VisibilityOutlinedIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
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
        <Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2}}>
                <Typography sx={{fontSize: 14, color: C.inkMuted}}>
                    {isRoot ? 'Bütün qurumların istifadəçiləri.' : 'Qurumunuzun istifadəçiləri.'}
                </Typography>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={openCreate}
                        sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', borderRadius: '8px', px: 2.5, py: 1, '&:hover': {backgroundColor: C.gold}}}>
                    Yeni istifadəçi
                </Button>
            </Box>

            <Box sx={{display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center'}}>
                <TextField
                    size="small" placeholder="Axtarış..." value={search} onChange={(e) => setSearch(e.target.value)}
                    InputProps={{startAdornment: <SearchIcon sx={{mr: 1, fontSize: 18, color: C.inkFaint}}/>}}
                    sx={{minWidth: 240, ...fieldSx}}
                />
                {isRoot && (
                    <TextField
                        select size="small" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}
                        SelectProps={{displayEmpty: true, renderValue: (v) => organizations.find((o) => o.id === v)?.title || 'Bütün qurumlar'}}
                        sx={{minWidth: 220, ...fieldSx}}
                    >
                        <MenuItem value="">Bütün qurumlar</MenuItem>
                        {organizations.map((o) => (
                            <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>
                        ))}
                    </TextField>
                )}
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
                roles={roles}
                departments={departments}
            />

            <UserDetailDialog
                open={!!detailTarget}
                onClose={() => setDetailTarget(null)}
                data={detailTarget}
            />

            <Dialog open={!!resetTarget} onClose={() => setResetTarget(null)} PaperProps={{sx: {...dialogPaperSx, maxWidth: 440}}}>
                <Box sx={{px: 3, pt: 3, pb: 2}}>
                    <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 500, mb: 1}}>Yeni şifrə göndərilsin?</Typography>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                        "{resetTarget?.name || resetTarget?.username}" üçün sistem yeni təsadüfi şifrə yaradıb birbaşa
                        onun email ünvanına ({resetTarget?.email}) göndərəcək. Şifrəni siz görməyəcəksiniz.
                    </Typography>
                </Box>
                <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                    <Button onClick={() => setResetTarget(null)} disabled={resetting} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                    <Button onClick={handleResetConfirm} disabled={resetting} variant="contained"
                            sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', borderRadius: '8px', '&:hover': {backgroundColor: C.gold}}}>
                        {resetting ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Göndər'}
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}