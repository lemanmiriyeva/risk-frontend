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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import {DataGrid} from '@mui/x-data-grid';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {DATA_GRID_LOCALE_AZ} from "@/lib/dataGridLocaleAz";

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

const EMPTY_FORM = {title: '', department: '', is_manager_role: false, parent: '', order: 99};

function flattenDepartments(deps, prefix = '') {
    let result = [];
    (deps || []).forEach((d) => {
        result.push({id: d.id, label: prefix + d.title, organization: d.organization});
        if (d.children && d.children.length) {
            result = result.concat(flattenDepartments(d.children, prefix + d.title + ' / '));
        }
    });
    return result;
}

function RoleFormDialog({open, onClose, onSubmit, initialData, loading, flatDepartments, rolesInSameDepartment, defaultDepartmentId}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const isEdit = !!initialData;

    useEffect(() => {
        if (initialData) {
            setForm({
                title: initialData.title || '',
                department: initialData.department || '',
                is_manager_role: !!initialData.is_manager_role,
                parent: initialData.parent || '',
                order: initialData.order ?? 99,
            });
        } else {
            setForm({...EMPTY_FORM, department: defaultDepartmentId || ''});
        }
    }, [initialData, open, defaultDepartmentId]);

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    const parentOptions = useMemo(
        () => rolesInSameDepartment.filter((r) => r.department === Number(form.department) && (!isEdit || r.id !== initialData?.id)),
        [rolesInSameDepartment, form.department, isEdit, initialData]
    );

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
                PaperProps={{sx: dialogPaperSx, component: 'form', onSubmit: handleSubmit}}>
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(180deg, ${C.surfaceRaised}, ${C.surface})`, borderBottom: `1px solid ${C.line}`}}>
                <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 600}}>
                    {isEdit ? 'Vəzifəni redaktə et' : 'Yeni vəzifə'}
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '65vh', overflowY: 'auto'}}>
                <TextField label="Vəzifənin adı" required fullWidth size="small" sx={fieldSx}
                           value={form.title} onChange={(e) => set('title', e.target.value)}/>

                <TextField select label="Departament" required fullWidth size="small" sx={fieldSx}
                           value={form.department} onChange={(e) => set('department', e.target.value)}>
                    <MenuItem value="">—</MenuItem>
                    {flatDepartments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>
                    ))}
                </TextField>

                <TextField select label="Valideyn vəzifə" fullWidth size="small" sx={fieldSx}
                           value={form.parent} onChange={(e) => set('parent', e.target.value)}
                           disabled={!form.department}
                           helperText="Yalnız eyni departamentdəki vəzifələr göstərilir.">
                    <MenuItem value="">—</MenuItem>
                    {parentOptions.map((r) => (
                        <MenuItem key={r.id} value={r.id}>{r.title}</MenuItem>
                    ))}
                </TextField>

                <TextField label="Sıra" type="number" fullWidth size="small" sx={fieldSx}
                           value={form.order} onChange={(e) => set('order', e.target.value)}/>

                <Box sx={{px: 0.5, py: 1, backgroundColor: C.surfaceRaised, borderRadius: '8px', border: `1px solid ${C.line}`}}>
                    <FormControlLabel
                        control={<Switch checked={form.is_manager_role} onChange={(e) => set('is_manager_role', e.target.checked)}/>}
                        label="Şöbə rəhbəri səlahiyyəti"
                    />
                </Box>
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

export default function RolesPage() {
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const isOrgAdmin = !!user?.is_org_admin;

    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

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

    const fetchDepartments = useCallback(async () => {
        try {
            const query = isRoot && selectedOrg ? `?organization=${selectedOrg}` : '';
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATION.DEPARTMENTS}${query}`);
            setDepartments(res.data || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    }, [isRoot, selectedOrg, enqueueSnackbar]);

    useEffect(() => {
        setSelectedDepartment('');
        if (isRoot && !selectedOrg) {
            setDepartments([]);
            return;
        }
        fetchDepartments();
    }, [fetchDepartments, isRoot, selectedOrg]);

    const flatDepartments = useMemo(() => flattenDepartments(departments), [departments]);

    const fetchRoles = useCallback(async () => {
        if (isRoot && !selectedOrg) {
            setRows([]);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (isRoot && selectedOrg) params.set('organization', selectedOrg);
            if (selectedDepartment) params.set('department', selectedDepartment);
            const query = params.toString();
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATION.ROLES}${query ? `?${query}` : ''}`);
            setRows(res.data || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [isRoot, selectedOrg, selectedDepartment, enqueueSnackbar]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

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
            const payload = {
                title: form.title,
                department: Number(form.department),
                is_manager_role: !!form.is_manager_role,
                parent: form.parent || null,
                order: Number(form.order) || 99,
            };
            if (editingRow) {
                await service_api.patch(`${NEXT_API_ENDPOINTS.ORGANIZATION.ROLES}${editingRow.id}/`, payload);
                enqueueSnackbar('Vəzifə yeniləndi.', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATION.ROLES, payload);
                enqueueSnackbar('Vəzifə yaradıldı.', {variant: 'success'});
            }
            setFormOpen(false);
            fetchRoles();
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
            await service_api.delete(`${NEXT_API_ENDPOINTS.ORGANIZATION.ROLES}${deleteTarget.id}/`);
            enqueueSnackbar('Vəzifə silindi.', {variant: 'success'});
            setDeleteTarget(null);
            fetchRoles();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setDeleting(false);
        }
    }

    const columns = useMemo(() => {
        const cols = [
            {field: 'title', headerName: 'Vəzifə', flex: 1.2, minWidth: 160},
            {
                field: 'department_title', headerName: 'Departament', flex: 1.2, minWidth: 180,
                valueGetter: (value, row) => row?.department_title || '—',
            },
        ];
        if (isRoot && !selectedOrg) {
            cols.push({
                field: 'organization', headerName: 'Qurum', flex: 1, minWidth: 160,
                valueGetter: (value, row) => row?.organization?.title || '—',
            });
        }
        cols.push(
            {
                field: 'is_manager_role', headerName: 'Şöbə rəhbəri', width: 130, align: 'center', headerAlign: 'center',
                renderCell: (params) => params.value
                    ? <Chip label="Bəli" size="small" sx={{backgroundColor: 'rgba(47,107,79,0.1)', color: '#2F6B4F'}}/>
                    : <Chip label="Xeyr" size="small" sx={{backgroundColor: 'rgba(0,0,0,0.05)', color: C.inkMuted}}/>,
            },
            {field: 'order', headerName: 'Sıra', width: 80},
            {
                field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
                renderCell: (params) => (
                    <Box sx={{display: 'flex', gap: 0.5}}>
                        <Tooltip title="Redaktə et">
                            <IconButton size="small" onClick={() => openEdit(params.row)} sx={{color: C.inkMuted}}>
                                <EditOutlinedIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                            <IconButton size="small" onClick={() => setDeleteTarget(params.row)} sx={{color: C.inkMuted}}>
                                <DeleteOutlineIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Box>
                ),
            },
        );
        return cols;
    }, [isRoot, selectedOrg]);

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
                    {isRoot ? 'Qurumların departamentlərinə bağlı vəzifələr.' : 'Qurumunuzun departamentlərinə bağlı vəzifələr.'}
                </Typography>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={openCreate}
                        disabled={isRoot && !selectedOrg}
                        sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', borderRadius: '8px', px: 2.5, py: 1, '&:hover': {backgroundColor: C.gold}}}>
                    Yeni vəzifə
                </Button>
            </Box>

            <Box sx={{display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center'}}>
                {isRoot && (
                    <TextField
                        select size="small" label="Qurum" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}
                        sx={{minWidth: 220, ...fieldSx}}
                    >
                        <MenuItem value="">— Qurum seçin —</MenuItem>
                        {organizations.map((o) => (
                            <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>
                        ))}
                    </TextField>
                )}
                <TextField
                    select size="small" label="Departament" value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    disabled={isRoot && !selectedOrg}
                    sx={{minWidth: 240, ...fieldSx}}
                >
                    <MenuItem value="">Bütün departamentlər</MenuItem>
                    {flatDepartments.map((d) => (
                        <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>
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
                    localeText={{
                        ...DATA_GRID_LOCALE_AZ,
                        noRowsLabel: isRoot && !selectedOrg ? 'Vəzifələri görmək üçün əvvəlcə qurum seçin.' : 'Heç bir vəzifə tapılmadı',
                    }}
                    sx={gridSx}
                />
            </Box>

            <RoleFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingRow}
                loading={saving}
                flatDepartments={flatDepartments}
                rolesInSameDepartment={rows}
                defaultDepartmentId={selectedDepartment}
            />

            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{sx: {...dialogPaperSx, maxWidth: 440}}}>
                <Box sx={{px: 3, pt: 3, pb: 2}}>
                    <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 500, mb: 1}}>Vəzifə silinsin?</Typography>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                        "{deleteTarget?.title}" vəzifəsini silmək istədiyinizə əminsiniz? Bu vəzifədə istifadəçi
                        varsa, silinə bilməz.
                    </Typography>
                </Box>
                <Box sx={{px: 3, pb: 3, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                    <Button onClick={handleDeleteConfirm} disabled={deleting} variant="contained"
                            sx={{backgroundColor: '#A23B3B', color: '#fff', textTransform: 'none', boxShadow: 'none', borderRadius: '8px', '&:hover': {backgroundColor: '#8A3131'}}}>
                        {deleting ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Sil'}
                    </Button>
                </Box>
            </Dialog>
        </Box>
    );
}