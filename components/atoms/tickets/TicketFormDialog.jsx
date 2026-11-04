"use client"
import React, {useEffect, useRef, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {C} from "@/components/theme/tokens";
import {PRIORITY_META, formatSize, validateFiles} from "./ticketMeta";

const EMPTY = {title: '', description: '', ticket_type: 'incident', category: '', priority: 'medium', departments: []};

export default function TicketFormDialog({open, onClose, meta, onCreated}) {
    const {enqueueSnackbar} = useSnackbar();
    const [form, setForm] = useState(EMPTY);
    const [files, setFiles] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [priorityTouched, setPriorityTouched] = useState(false);
    const fileRef = useRef(null);

    useEffect(() => {
        if (open) {
            setForm(EMPTY);
            setFiles([]);
            setErrors({});
            setPriorityTouched(false);
        }
    }, [open]);

    const categories = meta?.categories || [];
    const departments = meta?.departments || [];
    const set = (field) => (e) => setForm((f) => ({...f, [field]: e.target.value}));

    function onCategoryChange(e) {
        const id = e.target.value;
        const cat = categories.find((c) => c.id === id);
        setForm((f) => {
            const next = {...f, category: id};
            if (cat && !priorityTouched) next.priority = cat.default_priority || f.priority;
            // kateqoriyanın defolt şöbəsi - istifadəçi hələ şöbə seçməyibsə təklif olunur
            if (cat?.default_department && f.departments.length === 0) next.departments = [cat.default_department];
            return next;
        });
    }

    function addFiles(e) {
        const picked = Array.from(e.target.files || []);
        e.target.value = '';
        const err = validateFiles(picked);
        if (err) {
            enqueueSnackbar(err, {variant: 'warning'});
            return;
        }
        setFiles((prev) => [...prev, ...picked].slice(0, 10));
    }

    function validate() {
        const e = {};
        if (form.title.trim().length < 5) e.title = 'Mövzu ən azı 5 simvol olmalıdır';
        if (form.description.trim().length < 10) e.description = 'Problemi ən azı 10 simvolla təsvir edin';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                ticket_type: form.ticket_type,
                priority: form.priority,
                departments: form.departments,
            };
            if (form.category) payload.category = form.category;
            const res = await service_api.post(NEXT_API_ENDPOINTS.TICKETS.LIST, payload);
            const ticket = res.data;
            if (files.length) {
                try {
                    const fd = new FormData();
                    files.forEach((f) => fd.append('files', f));
                    await service_api.post(NEXT_API_ENDPOINTS.TICKETS.ATTACHMENTS(ticket.id), fd, {
                        headers: {'Content-Type': 'multipart/form-data'},
                    });
                } catch (e) {
                    enqueueSnackbar(`Müraciət yaradıldı, lakin fayllar yüklənmədi: ${handleError(e)}`, {variant: 'warning'});
                }
            }
            enqueueSnackbar(`${ticket.number} nömrəli müraciət yaradıldı.`, {variant: 'success'});
            onCreated?.(ticket);
        } catch (e) {
            const data = e?.response?.data;
            if (data && typeof data === 'object') {
                const fe = {};
                ['title', 'description', 'departments'].forEach((k) => {
                    if (data[k]) fe[k] = Array.isArray(data[k]) ? data[k].join(' ') : String(data[k]);
                });
                setErrors(fe);
            }
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    const selectedDepts = departments.filter((d) => form.departments.includes(d.id));

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{fontWeight: 600}}>Yeni müraciət</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{mt: 0}}>
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" label="Növ" value={form.ticket_type} onChange={set('ticket_type')} disabled={saving}>
                            {(meta?.types || []).map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField select fullWidth size="small" label="Kateqoriya" value={form.category} onChange={onCategoryChange} disabled={saving}>
                            <MenuItem value="">— Seçilməyib —</MenuItem>
                            {categories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    <Box component="span" sx={{display: 'inline-block', width: 9, height: 9, borderRadius: '50%', backgroundColor: c.color, mr: 1}}/>
                                    {c.title}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            select fullWidth size="small" label="Prioritet" value={form.priority} disabled={saving}
                            onChange={(e) => {setPriorityTouched(true); set('priority')(e);}}
                            helperText={(() => {
                                const p = (meta?.priorities || []).find((x) => x.value === form.priority);
                                return p ? `Cavab: ${p.sla_first_response_h} saat · Həll: ${p.sla_resolution_h} saat` : '';
                            })()}
                        >
                            {Object.entries(PRIORITY_META).map(([v, m]) => (
                                <MenuItem key={v} value={v}>
                                    <Box component="span" sx={{display: 'inline-block', width: 9, height: 9, borderRadius: '50%', backgroundColor: m.color, mr: 1}}/>
                                    {m.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth size="small" label="Mövzu" value={form.title} onChange={set('title')}
                            error={!!errors.title} helperText={errors.title || 'Qısa və aydın yazın, məs. "3-cü mərtəbədə printer çap etmir"'}
                            disabled={saving} inputProps={{maxLength: 200}}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth multiline minRows={4} label="Ətraflı təsvir" value={form.description} onChange={set('description')}
                            error={!!errors.description} disabled={saving}
                            helperText={errors.description || 'Nə baş verib, nə vaxtdan, hansı addımlarla təkrarlanır, xəta mətni varsa əlavə edin.'}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            multiple size="small" options={departments} value={selectedDepts} disabled={saving}
                            getOptionLabel={(d) => d.title}
                            isOptionEqualToValue={(a, b) => a.id === b.id}
                            onChange={(_, vals) => setForm((f) => ({...f, departments: vals.map((v) => v.id)}))}
                            renderTags={(vals, getTagProps) => vals.map((v, i) => (
                                <Chip {...getTagProps({index: i})} key={v.id} size="small" label={v.shortname || v.title}/>
                            ))}
                            renderOption={(props, d) => (
                                <li {...props} key={d.id}>
                                    <Box>
                                        <Typography sx={{fontSize: 14}}>{d.title}</Typography>
                                        {d.manager_name && <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>Rəhbər: {d.manager_name}</Typography>}
                                    </Box>
                                </li>
                            )}
                            noOptionsText="Şöbə tapılmadı"
                            renderInput={(params) => (
                                <TextField {...params} label="Məsul şöbələr" error={!!errors.departments}
                                           helperText={errors.departments || 'Problemin həllində iştirak edən bir və ya bir neçə şöbə seçin. Seçilməzsə kateqoriyanın defolt şöbəsinə, o da yoxdursa adminə yönləndirilir.'}/>
                            )}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <input ref={fileRef} type="file" multiple hidden onChange={addFiles}/>
                        <Button size="small" startIcon={<AttachFileIcon/>} onClick={() => fileRef.current?.click()} disabled={saving || files.length >= 10}>
                            Fayl əlavə et
                        </Button>
                        <Typography component="span" sx={{fontSize: 12, color: C.inkFaint, ml: 1}}>
                            Ən çox 10 fayl, hər biri 10 MB-a qədər (şəkil, PDF, Office, ZIP)
                        </Typography>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                            {files.map((f, i) => (
                                <Chip key={i} size="small" label={`${f.name} · ${formatSize(f.size)}`}
                                      onDelete={() => setFiles((p) => p.filter((_, j) => j !== i))}
                                      deleteIcon={<CloseIcon/>} disabled={saving}/>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{px: 3, py: 2}}>
                <Button onClick={onClose} disabled={saving}>İmtina</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={saving}>
                    {saving ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Müraciəti göndər'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
