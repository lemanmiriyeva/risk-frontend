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
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {C, dialogPaperSx, fieldSx, primaryButtonSx, formatDuration} from "./trainingsShared";

const VIDEO_ACCEPT = 'video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.ogv,.m4v,.mov';

/** Seçilmiş video faylının müddətini brauzerdə (yükləmədən əvvəl) oxuyur. */
function readVideoDuration(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        const done = (value) => {
            URL.revokeObjectURL(url);
            resolve(value);
        };
        video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : 0);
        video.onerror = () => done(0);
        video.src = url;
    });
}

export default function TrainingFormDialog({open, onClose, onSaved, initial, isRoot, organizations}) {
    const {enqueueSnackbar} = useSnackbar();
    const isEdit = !!initial?.id;
    const [form, setForm] = useState({title: '', description: '', pass_percent: 60, organization: '', is_active: true});
    const [video, setVideo] = useState(null);
    const [duration, setDuration] = useState(0);
    const [thumbnail, setThumbnail] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploadPct, setUploadPct] = useState(0);

    useEffect(() => {
        if (!open) return;
        setForm({
            title: initial?.title || '',
            description: initial?.description || '',
            pass_percent: initial?.pass_percent ?? 60,
            organization: initial?.organization || '',
            is_active: initial?.is_active ?? true,
        });
        setVideo(null);
        setDuration(0);
        setThumbnail(null);
        setUploadPct(0);
    }, [open, initial]);

    function set(field, value) {
        setForm((f) => ({...f, [field]: value}));
    }

    async function pickVideo(file) {
        setVideo(file || null);
        setDuration(file ? await readVideoDuration(file) : 0);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim()) {
            enqueueSnackbar('Başlıq doldurulmalıdır.', {variant: 'warning'});
            return;
        }
        if (!isEdit && !video) {
            enqueueSnackbar('Video faylı seçin.', {variant: 'warning'});
            return;
        }
        const pass = Number(form.pass_percent);
        if (!Number.isFinite(pass) || pass < 0 || pass > 100) {
            enqueueSnackbar('Keçid balı 0-100 arasında olmalıdır.', {variant: 'warning'});
            return;
        }

        const payload = new FormData();
        payload.append('title', form.title.trim());
        payload.append('description', form.description || '');
        payload.append('pass_percent', String(pass));
        payload.append('is_active', form.is_active ? 'true' : 'false');
        if (isRoot) payload.append('organization', form.organization || '');
        if (video) {
            payload.append('video', video);
            payload.append('duration_seconds', String(Math.round(duration || 0)));
        }
        if (thumbnail) payload.append('thumbnail', thumbnail);

        setSaving(true);
        setUploadPct(0);
        try {
            const config = {
                headers: {'Content-Type': 'multipart/form-data'},
                // Böyük video faylları üçün standart 50 saniyəlik limit kifayət etmir.
                timeout: 0,
                onUploadProgress: (ev) => {
                    if (ev.total) setUploadPct(Math.round((ev.loaded * 100) / ev.total));
                },
            };
            if (isEdit) {
                await service_api.patch(NEXT_API_ENDPOINTS.TRAININGS.MATERIAL_DETAIL(initial.id), payload, config);
                enqueueSnackbar('Təlim yeniləndi.', {variant: 'success'});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.TRAININGS.MATERIALS, payload, config);
                enqueueSnackbar('Təlim yükləndi.', {variant: 'success'});
            }
            onSaved?.();
            onClose();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth
                PaperProps={{sx: dialogPaperSx, component: 'form', onSubmit: handleSubmit}}>
            <Box sx={{
                px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`,
            }}>
                <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>
                    {isEdit ? 'Təlimi redaktə et' : 'Yeni təlim materialı'}
                </Typography>
                <IconButton size="small" onClick={onClose} disabled={saving}><CloseIcon fontSize="small"/></IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 2}}>
                <TextField label="Başlıq" required size="small" fullWidth sx={fieldSx}
                           value={form.title} onChange={(e) => set('title', e.target.value)}/>
                <TextField label="Təsvir" size="small" fullWidth multiline minRows={3} sx={fieldSx}
                           value={form.description} onChange={(e) => set('description', e.target.value)}/>

                <Button component="label" variant="outlined" startIcon={<MovieOutlinedIcon/>}
                        sx={{textTransform: 'none', borderColor: C.line, color: C.inkMuted, justifyContent: 'flex-start'}}>
                    {video
                        ? `${video.name}${duration ? ` · ${formatDuration(duration)}` : ''}`
                        : (isEdit ? 'Videonu dəyiş (istəyə bağlı)' : 'Video seçin (MP4, WebM, MOV)')}
                    <input type="file" hidden accept={VIDEO_ACCEPT} onChange={(e) => pickVideo(e.target.files?.[0])}/>
                </Button>
                {isEdit && video && (
                    <Typography sx={{fontSize: 12, color: C.danger, mt: -1}}>
                        Diqqət: video dəyişdirilsə, artıq baxmış istifadəçilərin statistikası köhnə video üzrə qalacaq.
                    </Typography>
                )}

                <Button component="label" variant="outlined" startIcon={<ImageOutlinedIcon/>}
                        sx={{textTransform: 'none', borderColor: C.line, color: C.inkMuted, justifyContent: 'flex-start'}}>
                    {thumbnail ? thumbnail.name : 'Örtük şəkli (istəyə bağlı)'}
                    <input type="file" hidden accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] || null)}/>
                </Button>

                <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap'}}>
                    <TextField label="Quiz keçid balı (%)" type="number" size="small" sx={{...fieldSx, width: 200}}
                               inputProps={{min: 0, max: 100}}
                               value={form.pass_percent} onChange={(e) => set('pass_percent', e.target.value)}/>
                    {isRoot && (
                        <TextField select label="Qurum" size="small" sx={{...fieldSx, flex: 1, minWidth: 200}}
                                   value={form.organization} onChange={(e) => set('organization', e.target.value)}>
                            <MenuItem value="">Bütün qurumlar</MenuItem>
                            {(organizations || []).map((o) => <MenuItem key={o.id} value={o.id}>{o.title}</MenuItem>)}
                        </TextField>
                    )}
                </Box>

                <FormControlLabel
                    control={<Switch checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)}
                                     sx={{'& .Mui-checked': {color: `${C.gold} !important`}, '& .Mui-checked + .MuiSwitch-track': {backgroundColor: `${C.gold} !important`}}}/>}
                    label={<Typography sx={{fontSize: 13.5, color: C.ink}}>
                        Aktivdir {form.is_active ? '(istifadəçilər görür)' : '(arxivdə, istifadəçilər görmür)'}
                    </Typography>}
                />

                {saving && video && (
                    <Box>
                        <LinearProgress variant="determinate" value={uploadPct}
                                        sx={{height: 6, borderRadius: 3, backgroundColor: C.goldTint, '& .MuiLinearProgress-bar': {backgroundColor: C.gold}}}/>
                        <Typography sx={{fontSize: 12, color: C.inkMuted, mt: 0.5}}>
                            Yüklənir: {uploadPct}%
                        </Typography>
                    </Box>
                )}
            </Box>

            <Box sx={{px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: `1px solid ${C.line}`}}>
                <Button onClick={onClose} disabled={saving} sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                <Button type="submit" variant="contained" disabled={saving} sx={primaryButtonSx}>
                    {saving ? 'Yüklənir…' : (isEdit ? 'Yadda saxla' : 'Yüklə')}
                </Button>
            </Box>
        </Dialog>
    );
}
