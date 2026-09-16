"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, CategoryIcon, EmptyState, ICON_MAP, dialogPaperSx, fieldSx, primaryButtonSx, softButtonSx,
} from "./bulletinShared";

const ICON_OPTIONS = Object.keys(ICON_MAP);

function slugify(value) {
    return (value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9əğıöşüçа-я]+/gi, '_')
        .replace(/^_+|_+$/g, '');
}

function CategoryForm({initial, onCancel, onSaved}) {
    const {enqueueSnackbar} = useSnackbar();
    const isEdit = !!initial?.id;
    const [form, setForm] = useState({
        label: initial?.label || '',
        key: initial?.key || '',
        plural_label: initial?.plural_label || '',
        description: initial?.description || '',
        icon: initial?.icon || 'description',
        order: initial?.order ?? 0,
        is_active: initial?.is_active ?? true,
    });
    const [keyTouched, setKeyTouched] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    function handleLabelChange(value) {
        set('label', value);
        if (!keyTouched) set('key', slugify(value));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.label.trim()) {
            enqueueSnackbar('Ad doldurulmalıdır.', {variant: 'warning'});
            return;
        }
        if (!form.key.trim()) {
            enqueueSnackbar('Açar doldurulmalıdır.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            const payload = {
                label: form.label,
                key: slugify(form.key),
                plural_label: form.plural_label || form.label,
                description: form.description,
                icon: form.icon,
                order: Number(form.order) || 0,
                is_active: form.is_active,
            };
            if (isEdit) {
                await service_api.patch(NEXT_API_ENDPOINTS.BULLETIN.CATEGORY_DETAIL(initial.id), payload);
                enqueueSnackbar('Kateqoriya yeniləndi.', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.BULLETIN.CATEGORIES, payload);
                enqueueSnackbar('Kateqoriya əlavə edildi.', {variant: 'success'});
            }
            onSaved();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${C.line}`}}>
                <IconButton size="small" onClick={onCancel}><ArrowBackIcon sx={{fontSize: 15}}/></IconButton>
                <Typography sx={{fontSize: 16, fontWeight: 700, color: C.ink}}>
                    {isEdit ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}
                </Typography>
            </Box>
            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2}}>
                <TextField label="Ad" required size="small" fullWidth sx={fieldSx}
                           helperText="Məs: Əmr, Bəyanat, Protokol"
                           value={form.label} onChange={(e) => handleLabelChange(e.target.value)}/>
                <TextField label="Cəm forma" size="small" fullWidth sx={fieldSx}
                           helperText="Boş buraxsanız, panel başlığında «Ad» görünəcək."
                           value={form.plural_label} onChange={(e) => set('plural_label', e.target.value)}/>
                <TextField label="Açar" required size="small" fullWidth sx={fieldSx}
                           helperText="Kiçik hərf, boşluqsuz - keçidlərdə istifadə olunur (məs. emr)."
                           value={form.key}
                           onChange={(e) => { setKeyTouched(true); set('key', e.target.value); }}/>
                <TextField label="Qısa izah" size="small" fullWidth sx={fieldSx}
                           value={form.description} onChange={(e) => set('description', e.target.value)}/>
                <Box sx={{display: 'flex', gap: 2}}>
                    <TextField select label="İkon" size="small" fullWidth sx={fieldSx}
                               value={form.icon} onChange={(e) => set('icon', e.target.value)}>
                        {ICON_OPTIONS.map((key) => (
                            <MenuItem key={key} value={key}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <CategoryIcon icon={key}/>
                                    {key}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField label="Sıra" type="number" size="small" sx={{...fieldSx, width: 110}}
                               value={form.order} onChange={(e) => set('order', e.target.value)}/>
                </Box>
                <FormControlLabel
                    control={<Switch checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)}/>}
                    label={<Typography sx={{fontSize: 13, color: C.inkMuted}}>Aktivdir (formalarda görünsün)</Typography>}
                />
            </Box>
            <Box sx={{px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: `1px solid ${C.line}`}}>
                <Button onClick={onCancel} disabled={saving} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                <Button type="submit" variant="contained" disabled={saving} sx={primaryButtonSx}>
                    {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : (isEdit ? 'Yadda saxla' : 'Əlavə et')}
                </Button>
            </Box>
        </Box>
    );
}

function CategoryRow({category, onEdit, onDelete, deleting}) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25,
            borderTop: `1px solid ${C.line}`, opacity: category.is_active ? 1 : 0.55,
        }}>
            <Box sx={{
                width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                backgroundColor: C.goldTint, color: C.gold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <CategoryIcon icon={category.icon}/>
            </Box>
            <Box sx={{minWidth: 0, flex: 1}}>
                <Typography sx={{fontSize: 13.5, fontWeight: 600, color: C.ink}}>
                    {category.label}
                    {!category.is_active && (
                        <Typography component="span" sx={{fontSize: 11, color: C.inkFaint, ml: 0.75}}>
                            (deaktiv)
                        </Typography>
                    )}
                </Typography>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>
                    /{category.key} · {category.documents_count ?? 0} sənəd · sıra {category.order}
                </Typography>
            </Box>
            <Tooltip title="Redaktə et">
                <IconButton size="small" onClick={() => onEdit(category)} sx={{color: C.inkMuted}}>
                    <EditOutlinedIcon sx={{fontSize: 17}}/>
                </IconButton>
            </Tooltip>
            <Tooltip title="Sil">
                <IconButton size="small" onClick={() => onDelete(category)} disabled={deleting} sx={{color: C.danger}}>
                    {deleting ? <CircularProgress size={15}/> : <DeleteOutlineIcon sx={{fontSize: 17}}/>}
                </IconButton>
            </Tooltip>
        </Box>
    );
}

export default function CategoryManagerDialog({open, onClose, categories, loading, onChanged}) {
    const {enqueueSnackbar} = useSnackbar();
    const [mode, setMode] = useState('list'); // 'list' | 'create' | edit-target object
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        if (open) setMode('list');
    }, [open]);

    async function handleDelete(category) {
        setDeletingId(category.id);
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.BULLETIN.CATEGORY_DETAIL(category.id));
            enqueueSnackbar('Kateqoriya silindi.', {variant: 'success'});
            onChanged();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setDeletingId(null);
        }
    }

    function handleSaved() {
        setMode('list');
        onChanged();
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{sx: dialogPaperSx}}>
            {mode === 'list' ? (
                <>
                    <Box sx={{
                        px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`,
                    }}>
                        <Box>
                            <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>Kateqoriyalar</Typography>
                            <Typography sx={{fontSize: 12, color: C.inkFaint, mt: 0.3}}>
                                Fərman, Sərəncam və s. - istədiyiniz qədər yeni növ əlavə edin.
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small"/></IconButton>
                    </Box>

                    <Box sx={{px: 3, maxHeight: 380, overflowY: 'auto'}}>
                        {loading ? (
                            <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                                <CircularProgress size={22}/>
                            </Box>
                        ) : categories.length === 0 ? (
                            <EmptyState title="Hələ kateqoriya yoxdur" hint="Aşağıdan ilk kateqoriyanı əlavə edin."/>
                        ) : categories.map((c) => (
                            <CategoryRow key={c.id} category={c} onEdit={setMode}
                                         onDelete={handleDelete} deleting={deletingId === c.id}/>
                        ))}
                    </Box>

                    <Box sx={{px: 3, pb: 3, pt: 2, borderTop: `1px solid ${C.line}`}}>
                        <Button fullWidth startIcon={<AddIcon/>} onClick={() => setMode('create')} sx={softButtonSx}>
                            Yeni kateqoriya
                        </Button>
                    </Box>
                </>
            ) : (
                <CategoryForm
                    initial={mode === 'create' ? null : mode}
                    onCancel={() => setMode('list')}
                    onSaved={handleSaved}
                />
            )}
        </Dialog>
    );
}