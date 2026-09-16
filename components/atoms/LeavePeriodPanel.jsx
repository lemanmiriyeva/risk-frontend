"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';

import BeachAccessOutlinedIcon from '@mui/icons-material/BeachAccessOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';

import {useSnackbar} from "notistack";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

const GOLD = '#C9A24B';
const NAVY = '#0E1730';

function fieldSx() {
    return {
        '& .MuiOutlinedInput-root': {borderRadius: 1.5, backgroundColor: '#FFFFFF'},
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: GOLD},
        '& .MuiInputLabel-root.Mui-focused': {color: '#8A6D2C'},
    };
}

function formatDate(value) {
    if (!value) return '—';
    const [y, m, d] = value.split('-');
    return `${d}.${m}.${y}`;
}

/**
 * Şəxsi kabinetdəki «Məzuniyyət» tabı.
 *
 * Bu bölmə yalnız şöbə müdiri və ondan yuxarı vəzifələr üçün görünür -
 * səlahiyyət backend-də yoxlanılır (`allowed` sahəsi), frontend sadəcə
 * nəticəni göstərir. Yəni UI-ni gizlətmək təhlükəsizlik tədbiri deyil,
 * backend hər halda 403 qaytarır.
 */
export default function LeavePeriodPanel() {
    const {enqueueSnackbar} = useSnackbar();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [allowed, setAllowed] = useState(false);
    const [options, setOptions] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [errors, setErrors] = useState({});

    const [replacementUser, setReplacementUser] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [note, setNote] = useState('');

    const activePeriod = useMemo(
        () => periods.find(p => p.is_active_now && !p.is_cancelled) || null,
        [periods]
    );

    async function loadAll() {
        try {
            const eligibility = await service_api.get(
                NEXT_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_ELIGIBILITY
            );
            setAllowed(!!eligibility.data?.allowed);
            setOptions(eligibility.data?.replacement_options || []);

            if (eligibility.data?.allowed) {
                const res = await service_api.get(
                    NEXT_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_PERIODS
                );
                // DRF pagination açıq ola bilər - hər iki formanı dəstəkləyirik.
                const data = res.data;
                setPeriods(Array.isArray(data) ? data : (data?.results || []));
            }
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function resetForm() {
        setReplacementUser('');
        setStartDate('');
        setEndDate('');
        setNote('');
        setErrors({});
    }

    async function handleCreate(e) {
        e.preventDefault();

        const errs = {};
        if (!replacementUser) errs.replacement_user = 'Əvəzləyici seçilməlidir';
        if (!startDate) errs.start_date = 'Başlama tarixi tələb olunur';
        if (!endDate) errs.end_date = 'Bitmə tarixi tələb olunur';
        if (startDate && endDate && endDate < startDate) {
            errs.end_date = 'Bitmə tarixi başlama tarixindən əvvəl ola bilməz';
        }
        setErrors(errs);
        if (Object.keys(errs).length) return;

        setSaving(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_PERIODS, {
                replacement_user: replacementUser,
                start_date: startDate,
                end_date: endDate,
                note: note || '',
            });
            enqueueSnackbar('Məzuniyyət dövrü əlavə edildi.', {variant: 'success'});
            resetForm();
            await loadAll();
        } catch (err) {
            const data = err?.response?.data;
            if (data && typeof data === 'object' && !Array.isArray(data)) setErrors(data);
            enqueueSnackbar(
                data?.non_field_errors?.[0] || data?.detail || handleError(err),
                {variant: 'error'}
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleCancel(period) {
        setSaving(true);
        try {
            await service_api.patch(
                NEXT_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_PERIOD_DETAIL(period.id),
                {is_cancelled: true}
            );
            enqueueSnackbar('Məzuniyyət dövrü ləğv edildi.', {variant: 'success'});
            await loadAll();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(period) {
        setSaving(true);
        try {
            await service_api.delete(
                NEXT_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_PERIOD_DETAIL(period.id)
            );
            enqueueSnackbar('Qeyd silindi.', {variant: 'success'});
            await loadAll();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                <CircularProgress size={26} sx={{color: NAVY}}/>
            </Box>
        );
    }

    if (!allowed) {
        return (
            <Alert severity="info" sx={{borderRadius: 2}}>
                Məzuniyyət dövrü və əvəzləyici təyin etmək yalnız şöbə müdiri və
                ondan yuxarı vəzifələr üçün nəzərdə tutulub.
            </Alert>
        );
    }

    return (
        <Box>
            <Typography sx={{
                fontSize: 12.5, fontWeight: 700, color: NAVY,
                textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5,
            }}>
                Məzuniyyət və əvəzləyici
            </Typography>
            <Typography sx={{fontSize: 12.5, color: '#9CA3AF', mb: 2}}>
                Məzuniyyət dövründə sizə gələn icazə sorğuları seçdiyiniz əvəzləyiciyə
                yönləndirilir. Dövr bitdikdə sistem avtomatik olaraq sizə qayıdır.
            </Typography>

            {activePeriod && (
                <Alert
                    icon={<SwapHorizOutlinedIcon fontSize="inherit"/>}
                    severity="warning"
                    sx={{borderRadius: 2, mb: 2.5}}
                >
                    Hazırda məzuniyyətdəsiniz ({formatDate(activePeriod.start_date)} —{' '}
                    {formatDate(activePeriod.end_date)}). Sorğularınıza{' '}
                    <b>{activePeriod.replacement_user_name}</b> baxır.
                </Alert>
            )}

            {/* Yeni dövr formu */}
            <Box component="form" onSubmit={handleCreate} sx={{mb: 3}}>
                <TextField
                    fullWidth margin="normal" select label="Əvəzləyici şəxs"
                    disabled={saving}
                    value={replacementUser}
                    onChange={(e) => setReplacementUser(e.target.value)}
                    error={!!errors.replacement_user}
                    helperText={
                        Array.isArray(errors.replacement_user)
                            ? errors.replacement_user[0]
                            : errors.replacement_user
                    }
                    sx={fieldSx()}
                    InputProps={{
                        startAdornment: (
                            <Box sx={{display: 'flex', mr: 1, color: '#9CA3AF'}}>
                                <SwapHorizOutlinedIcon fontSize="small"/>
                            </Box>
                        ),
                    }}
                >
                    <MenuItem value="">— Seçin —</MenuItem>
                    {options.map(opt => (
                        <MenuItem key={opt.id} value={opt.id}>
                            {opt.name}{opt.role_name ? ` — ${opt.role_name}` : ''}
                        </MenuItem>
                    ))}
                </TextField>

                <Box sx={{display: 'flex', gap: 2, flexDirection: {xs: 'column', sm: 'row'}}}>
                    <TextField
                        fullWidth margin="normal" type="date" label="Başlama tarixi"
                        disabled={saving}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{shrink: true}}
                        error={!!errors.start_date}
                        helperText={
                            Array.isArray(errors.start_date) ? errors.start_date[0] : errors.start_date
                        }
                        sx={fieldSx()}
                    />
                    <TextField
                        fullWidth margin="normal" type="date" label="Bitmə tarixi"
                        disabled={saving}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{shrink: true}}
                        error={!!errors.end_date}
                        helperText={
                            Array.isArray(errors.end_date) ? errors.end_date[0] : errors.end_date
                        }
                        sx={fieldSx()}
                    />
                </Box>

                <TextField
                    fullWidth margin="normal" label="Qeyd (istəyə bağlı)"
                    disabled={saving}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    sx={fieldSx()}
                />

                <Button
                    type="submit" variant="contained" disabled={saving}
                    startIcon={saving ? null : <SaveOutlinedIcon/>}
                    sx={{
                        mt: 2, backgroundColor: NAVY, textTransform: 'none',
                        fontWeight: 700, py: 1.1, px: 3, borderRadius: 1.5,
                        '&:hover': {backgroundColor: '#0B1024'},
                        '&.Mui-disabled': {backgroundColor: '#D9DCE3', color: '#9CA3AF'},
                    }}
                >
                    {saving ? <CircularProgress size={20} sx={{color: '#fff'}}/> : 'Məzuniyyət əlavə et'}
                </Button>
            </Box>

            <Divider sx={{my: 3}}/>

            <Typography sx={{
                fontSize: 12.5, fontWeight: 700, color: NAVY,
                textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5,
            }}>
                Məzuniyyət tarixçəsi
            </Typography>

            {!periods.length && (
                <Typography sx={{fontSize: 13, color: '#9CA3AF'}}>
                    Hələ heç bir məzuniyyət dövrü əlavə etməmisiniz.
                </Typography>
            )}

            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.25}}>
                {periods.map(p => (
                    <Box
                        key={p.id}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            border: '1px solid #E6E9EF', borderRadius: 2,
                            px: 2, py: 1.25,
                            backgroundColor: p.is_active_now && !p.is_cancelled ? '#FFF9EC' : '#FFF',
                            opacity: p.is_cancelled ? 0.6 : 1,
                        }}
                    >
                        <BeachAccessOutlinedIcon sx={{fontSize: 20, color: GOLD}}/>
                        <Box sx={{flexGrow: 1, minWidth: 0}}>
                            <Typography sx={{fontSize: 13.5, fontWeight: 600, color: NAVY}}>
                                {formatDate(p.start_date)} — {formatDate(p.end_date)}
                            </Typography>
                            <Typography sx={{fontSize: 12.5, color: '#6B7280'}}>
                                Əvəzləyici: {p.replacement_user_name}
                                {p.replacement_role_name ? ` (${p.replacement_role_name})` : ''}
                                {p.note ? ` · ${p.note}` : ''}
                            </Typography>
                        </Box>

                        {p.is_cancelled ? (
                            <Chip size="small" label="Ləğv edilib" sx={{fontWeight: 600}}/>
                        ) : p.is_active_now ? (
                            <Chip
                                size="small" label="Aktiv"
                                sx={{backgroundColor: 'rgba(201,162,75,0.15)', color: '#8A6D2C', fontWeight: 700}}
                            />
                        ) : null}

                        {!p.is_cancelled && (
                            <Tooltip title="Məzuniyyəti ləğv et">
                                <span>
                                    <IconButton
                                        size="small" disabled={saving}
                                        onClick={() => handleCancel(p)}
                                    >
                                        <BlockOutlinedIcon sx={{fontSize: 18, color: '#9CA3AF'}}/>
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}
                        <Tooltip title="Qeydi sil">
                            <span>
                                <IconButton
                                    size="small" disabled={saving}
                                    onClick={() => handleDelete(p)}
                                >
                                    <DeleteOutlineIcon sx={{fontSize: 18, color: '#C05B5B'}}/>
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
