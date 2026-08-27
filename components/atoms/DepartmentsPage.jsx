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
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";

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

const EMPTY_FORM = {title: '', shortname: '', parent: '', organization: '', order: 2, unique_code: ''};

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

function collectDescendantIds(dep) {
    let ids = [dep.id];
    (dep.children || []).forEach((c) => {
        ids = ids.concat(collectDescendantIds(c));
    });
    return ids;
}

function DepartmentFormDialog({open, onClose, onSubmit, initialData, loading, isRoot, organizations, allDepartmentsFlat, defaultParentId, defaultOrganization}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const isEdit = !!initialData;

    useEffect(() => {
        if (initialData) {
            setForm({
                title: initialData.title || '',
                shortname: initialData.shortname || '',
                parent: initialData.parent || '',
                organization: initialData.organization || '',
                order: initialData.order ?? 2,
                unique_code: initialData.unique_code || '',
            });
        } else {
            setForm({...EMPTY_FORM, parent: defaultParentId || '', organization: defaultOrganization || ''});
        }
    }, [initialData, open, defaultParentId, defaultOrganization]);

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    const excludedParentIds = useMemo(() => (isEdit ? collectDescendantIds(initialData) : []), [isEdit, initialData]);

    const parentOptions = useMemo(() => {
        return allDepartmentsFlat.filter((d) => {
            if (excludedParentIds.includes(d.id)) return false;
            if (form.organization && d.organization !== Number(form.organization)) return false;
            return true;
        });
    }, [allDepartmentsFlat, excludedParentIds, form.organization]);

    function handleSubmit(e) {
        e.preventDefault();
        onSubmit(form);
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
                PaperProps={{sx: dialogPaperSx, component: 'form', onSubmit: handleSubmit}}>
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: `linear-gradient(180deg, ${C.surfaceRaised}, ${C.surface})`, borderBottom: `1px solid ${C.line}`}}>
                <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 600}}>
                    {isEdit ? 'Departamenti redaktə et' : 'Yeni departament'}
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{color: C.inkMuted}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '65vh', overflowY: 'auto'}}>
                <TextField label="Departamentin adı" required fullWidth size="small" sx={fieldSx}
                           value={form.title} onChange={(e) => set('title', e.target.value)}/>
                <TextField label="Qısaltma" fullWidth size="small" sx={fieldSx}
                           value={form.shortname} onChange={(e) => set('shortname', e.target.value)}/>

                {isRoot && (
                    <TextField select label="Qurum" required fullWidth size="small" sx={fieldSx}
                               disabled={isEdit}
                               value={form.organization} onChange={(e) => set('organization', e.target.value)}>
                        {organizations.map((o) => (
                            <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>
                        ))}
                    </TextField>
                )}

                <TextField select label="Valideyn departament (ana)" fullWidth size="small" sx={fieldSx}
                           value={form.parent} onChange={(e) => set('parent', e.target.value)}
                           helperText="Boş buraxsanız - bu, ana (kök) departament olacaq.">
                    <MenuItem value="">— Ana departament —</MenuItem>
                    {parentOptions.map((d) => (
                        <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>
                    ))}
                </TextField>

                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField label="Sıra" type="number" fullWidth size="small" sx={fieldSx}
                               value={form.order} onChange={(e) => set('order', e.target.value)}/>
                    <TextField label="Unikal kod" fullWidth size="small" sx={fieldSx}
                               value={form.unique_code} onChange={(e) => set('unique_code', e.target.value)}/>
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

function DepartmentNode({dep, depth, onEdit, onDelete, onAddChild}) {
    const [open, setOpen] = useState(depth < 1);
    const hasChildren = (dep.children || []).length > 0;

    return (
        <Box>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1, py: 1.1, pl: 1 + depth * 3, pr: 1.5,
                borderBottom: `1px solid ${C.line}`, backgroundColor: depth === 0 ? C.surfaceRaised : C.surface,
                '&:hover': {backgroundColor: 'rgba(0,0,0,0.015)'},
            }}>
                <IconButton size="small" onClick={() => setOpen((o) => !o)} sx={{visibility: hasChildren ? 'visible' : 'hidden', color: C.inkMuted}}>
                    {open ? <ExpandMoreIcon fontSize="small"/> : <ChevronRightIcon fontSize="small"/>}
                </IconButton>

                <AccountTreeOutlinedIcon sx={{fontSize: 17, color: depth === 0 ? C.gold : C.inkFaint}}/>

                <Box sx={{flex: 1, minWidth: 0}}>
                    <Typography sx={{fontSize: 14, fontWeight: depth === 0 ? 600 : 500, color: C.ink}}>
                        {dep.title} {dep.shortname ? <span style={{color: C.inkFaint, fontWeight: 400}}>({dep.shortname})</span> : null}
                    </Typography>
                    <Box sx={{display: 'flex', gap: 1, mt: 0.3}}>
                        {dep.manager_name && (
                            <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>Rəhbər: {dep.manager_name}</Typography>
                        )}
                    </Box>
                </Box>

                <Chip icon={<GroupOutlinedIcon sx={{fontSize: 14}}/>} label={dep.employee_count ?? 0} size="small"
                      sx={{backgroundColor: 'rgba(0,0,0,0.04)', color: C.inkMuted, height: 22}}/>
                <Chip icon={<WorkOutlineIcon sx={{fontSize: 14}}/>} label={(dep.roles || []).length} size="small"
                      sx={{backgroundColor: C.goldTint, color: C.gold, height: 22}}/>

                <Tooltip title="Alt departament əlavə et">
                    <IconButton size="small" onClick={() => onAddChild(dep)} sx={{color: C.inkMuted}}>
                        <AddCircleOutlineIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Redaktə et">
                    <IconButton size="small" onClick={() => onEdit(dep)} sx={{color: C.inkMuted}}>
                        <EditOutlinedIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Sil">
                    <IconButton size="small" onClick={() => onDelete(dep)} sx={{color: C.inkMuted}}>
                        <DeleteOutlineIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            </Box>

            {hasChildren && (
                <Collapse in={open} unmountOnExit>
                    {dep.children.map((child) => (
                        <DepartmentNode key={child.id} dep={child} depth={depth + 1}
                                        onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild}/>
                    ))}
                </Collapse>
            )}
        </Box>
    );
}

export default function DepartmentsPage() {
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const isOrgAdmin = !!user?.is_org_admin;

    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState('');

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formOpen, setFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [defaultParentId, setDefaultParentId] = useState('');
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
        setLoading(true);
        try {
            const query = isRoot && selectedOrg ? `?organization=${selectedOrg}` : '';
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATION.DEPARTMENTS}${query}`);
            setDepartments(res.data || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [isRoot, selectedOrg, enqueueSnackbar]);

    useEffect(() => {
        fetchDepartments();
    }, [fetchDepartments]);

    const allDepartmentsFlat = useMemo(() => flattenDepartments(departments), [departments]);

    function openCreate() {
        setEditingRow(null);
        setDefaultParentId('');
        setFormOpen(true);
    }

    function openAddChild(parentDep) {
        setEditingRow(null);
        setDefaultParentId(parentDep.id);
        setFormOpen(true);
    }

    function openEdit(dep) {
        setEditingRow(dep);
        setFormOpen(true);
    }

    async function handleFormSubmit(form) {
        setSaving(true);
        try {
            const payload = {
                title: form.title,
                shortname: form.shortname,
                parent: form.parent || null,
                order: Number(form.order) || 2,
                unique_code: form.unique_code || null,
            };
            if (isRoot && form.organization) payload.organization = Number(form.organization);

            if (editingRow) {
                await service_api.patch(`${NEXT_API_ENDPOINTS.ORGANIZATION.DEPARTMENTS}${editingRow.id}/`, payload);
                enqueueSnackbar('Departament yeniləndi.', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATION.DEPARTMENTS, payload);
                enqueueSnackbar('Departament yaradıldı.', {variant: 'success'});
            }
            setFormOpen(false);
            fetchDepartments();
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
            await service_api.delete(`${NEXT_API_ENDPOINTS.ORGANIZATION.DEPARTMENTS}${deleteTarget.id}/`);
            enqueueSnackbar('Departament silindi.', {variant: 'success'});
            setDeleteTarget(null);
            fetchDepartments();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setDeleting(false);
        }
    }

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
                    {isRoot ? 'Qurumların ana və alt departamentləri.' : 'Qurumunuzun ana və alt departamentləri.'}
                </Typography>
                <Button variant="contained" startIcon={<AddIcon/>} onClick={openCreate}
                        disabled={isRoot && !selectedOrg}
                        sx={{backgroundColor: C.ink, color: C.bg, textTransform: 'none', boxShadow: 'none', borderRadius: '8px', px: 2.5, py: 1, '&:hover': {backgroundColor: C.gold}}}>
                    Yeni departament
                </Button>
            </Box>

            {isRoot && (
                <Box sx={{mb: 3}}>
                    <TextField
                        select size="small" label="Qurum" value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}
                        sx={{minWidth: 260, ...fieldSx}}
                    >
                        <MenuItem value="">— Qurum seçin —</MenuItem>
                        {organizations.map((o) => (
                            <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>
                        ))}
                    </TextField>
                </Box>
            )}

            <Box sx={{border: `1px solid ${C.line}`, borderRadius: '10px', overflow: 'hidden', backgroundColor: C.surface}}>
                {loading ? (
                    <Box sx={{p: 5, display: 'flex', justifyContent: 'center'}}>
                        <CircularProgress size={22}/>
                    </Box>
                ) : departments.length === 0 ? (
                    <Box sx={{p: 5, textAlign: 'center'}}>
                        <Typography sx={{color: C.inkFaint, fontSize: 14}}>
                            {isRoot && !selectedOrg ? 'Departamentləri görmək üçün əvvəlcə qurum seçin.' : 'Heç bir departament tapılmadı.'}
                        </Typography>
                    </Box>
                ) : (
                    departments.map((dep) => (
                        <DepartmentNode key={dep.id} dep={dep} depth={0}
                                        onEdit={openEdit} onDelete={setDeleteTarget} onAddChild={openAddChild}/>
                    ))
                )}
            </Box>

            <DepartmentFormDialog
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingRow}
                loading={saving}
                isRoot={isRoot}
                organizations={organizations}
                allDepartmentsFlat={allDepartmentsFlat}
                defaultParentId={defaultParentId}
                defaultOrganization={selectedOrg}
            />

            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} PaperProps={{sx: {...dialogPaperSx, maxWidth: 440}}}>
                <Box sx={{px: 3, pt: 3, pb: 2}}>
                    <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 500, mb: 1}}>Departament silinsin?</Typography>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                        "{deleteTarget?.title}" departamentini silmək istədiyinizə əminsiniz? Alt departamenti, vəzifəsi
                        və ya işçisi olan departamentlər silinə bilməz.
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