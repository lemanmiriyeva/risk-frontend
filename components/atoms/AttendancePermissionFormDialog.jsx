"use client"
import React, {useEffect, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';

const EMPTY_FORM = {
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    reason: '',
};

export default function AttendancePermissionFormDialog({open, onClose, onSubmit, loading}) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            setForm(EMPTY_FORM);
            setErrors({});
        }
    }, [open]);

    const handleChange = (field) => (e) => {
        setForm((f) => ({...f, [field]: e.target.value}));
    };

    function validate() {
        const e = {};
        if (!form.date) e.date = 'Tarix seçilməlidir';
        if (!form.start_time) e.start_time = 'Başlanğıc saatı seçilməlidir';
        if (!form.end_time) e.end_time = 'Bitmə saatı seçilməlidir';
        if (form.start_time && form.end_time && form.start_time >= form.end_time) {
            e.end_time = 'Bitmə saatı başlanğıc saatından sonra olmalıdır';
        }
        if (!form.location?.trim()) e.location = 'Yer göstərilməlidir';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleSave() {
        if (!validate()) return;
        onSubmit(form);
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Yeni icazə sorğusu</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{mt: 0.5}}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth type="date" label="Tarix" InputLabelProps={{shrink: true}}
                            value={form.date} onChange={handleChange('date')}
                            error={!!errors.date} helperText={errors.date} disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth type="time" label="Başlanğıc saatı" InputLabelProps={{shrink: true}}
                            value={form.start_time} onChange={handleChange('start_time')}
                            error={!!errors.start_time} helperText={errors.start_time} disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth type="time" label="Bitmə saatı" InputLabelProps={{shrink: true}}
                            value={form.end_time} onChange={handleChange('end_time')}
                            error={!!errors.end_time} helperText={errors.end_time} disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth label="Yer" placeholder="Məs: Poliklinika, Notarius ofisi..."
                            value={form.location} onChange={handleChange('location')}
                            error={!!errors.location} helperText={errors.location} disabled={loading}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth multiline minRows={2} label="Səbəb / qeyd (istəyə bağlı)"
                            value={form.reason} onChange={handleChange('reason')} disabled={loading}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{px: 3, py: 2}}>
                <Button onClick={onClose} disabled={loading}>İmtina</Button>
                <Button onClick={handleSave} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Göndər'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}