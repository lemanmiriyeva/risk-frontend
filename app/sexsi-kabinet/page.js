"use client"
import React, {useEffect, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import {useSnackbar} from "notistack";

import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import WcOutlinedIcon from '@mui/icons-material/WcOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {useAppDispatch} from "@/lib/hooks";
import {updateUser} from "@/lib/features/user/userSlice";

const GENDER_OPTIONS = [
    {value: 'male', label: 'Kişi'},
    {value: 'female', label: 'Qadın'},
]

const GOLD = '#C9A24B';
const NAVY = '#0E1730';
const NAVY_DEEP = '#020624';

function fieldSx(disabled) {
    return {
        '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
            backgroundColor: disabled ? '#F3F4F7' : '#FFFFFF',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: GOLD,
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: '#8A6D2C',
        },
    };
}

function LockedField({label, value, icon}) {
    return (
        <TextField
            fullWidth margin="normal" label={label} value={value} disabled
            sx={fieldSx(true)}
            InputProps={{
                startAdornment: icon ? <Box sx={{display: 'flex', mr: 1, color: '#9CA3AF'}}>{icon}</Box> : undefined,
                endAdornment: <Tooltip title="Yalnız administrator dəyişə bilər">
                    <LockOutlinedIcon sx={{fontSize: 17, color: '#C3C8D1'}}/>
                </Tooltip>,
            }}
        />
    );
}

export default function Page() {
    const dispatch = useAppDispatch();
    const {enqueueSnackbar} = useSnackbar();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [dirty, setDirty] = useState(false);

    const [readOnly, setReadOnly] = useState({username: '', email: '', fin_kod: '', organization: null, name: ''});
    const [image, setImage] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [gender, setGender] = useState('');

    function fillForm(data) {
        setReadOnly({
            username: data.username || '',
            email: data.email || '',
            fin_kod: data.fin_kod || '—',
            organization: data.organization || null,
            name: data.name || `${data.firstname || ''} ${data.lastname || ''}`.trim(),
        })
        setImage(data.image || '');
        setFirstname(data.firstname || '');
        setLastname(data.lastname || '');
        setPhoneNumber(data.phone_number || '');
        setBirthDate(data.birth_date || '');
        setGender(data.gender || '');
        setDirty(false);
    }

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER);
                fillForm(res.data);
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function validate() {
        const errs = {};
        if (!firstname.trim()) errs.firstname = 'Ad tələb olunur';
        if (!lastname.trim()) errs.lastname = 'Soyad tələb olunur';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        e.target.value = null; // eyni faylı təkrar seçmək mümkün olsun deyə
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            enqueueSnackbar('Yalnız JPG, PNG və ya WEBP formatı dəstəklənir.', {variant: 'error'});
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            enqueueSnackbar('Şəkil 5MB-dan böyük ola bilməz.', {variant: 'error'});
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        setAvatarUploading(true);
        try {
            const res = await service_api.patch(NEXT_API_ENDPOINTS.AUTHENTICATION.USER, formData);
            fillForm(res.data);
            dispatch(updateUser(res.data));
            enqueueSnackbar('Profil şəkli yeniləndi.', {variant: 'success'});
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setAvatarUploading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                firstname,
                lastname,
                phone_number: phoneNumber || null,
                birth_date: birthDate || null,
                gender: gender || null,
            };
            const res = await service_api.patch(NEXT_API_ENDPOINTS.AUTHENTICATION.USER, payload);
            fillForm(res.data);
            dispatch(updateUser(res.data));
            enqueueSnackbar('Məlumatlarınız uğurla yeniləndi.', {variant: 'success'});
        } catch (err) {
            const data = err?.response?.data;
            if (data && typeof data === 'object') setErrors(data);
            enqueueSnackbar(data?.detail || handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    const initials = `${(firstname || '')[0] || ''}${(lastname || '')[0] || ''}`.toUpperCase() || '—';

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh'}}>
                <CircularProgress sx={{color: NAVY}}/>
            </Box>
        );
    }

    return (
        <Box sx={{backgroundColor: '#EEF1F5', minHeight: 'calc(100vh - 64px)', pb: 8}}>

            {/* HERO */}
            <Box sx={{
                position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
                px: {xs: 3, md: 8}, pt: {xs: 5, md: 7}, pb: {xs: 9, md: 11},
            }}>
                <Box sx={{
                    position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(201,162,75,0.18) 0%, rgba(201,162,75,0) 70%)',
                }}/>
                <Typography sx={{color: GOLD, letterSpacing: 4, fontSize: 12.5, fontWeight: 700, mb: 2}}>
                    ŞƏXSİ KABİNET
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2.5, position: 'relative', zIndex: 1}}>
                    <Tooltip title="Profil şəklini dəyiş">
                        <Box
                            onClick={() => !avatarUploading && fileInputRef.current?.click()}
                            sx={{position: 'relative', width: 76, height: 76, cursor: 'pointer'}}
                        >
                            <Avatar
                                src={image || undefined}
                                sx={{
                                    width: 76, height: 76, fontSize: 28, fontWeight: 700,
                                    bgcolor: 'rgba(201,162,75,0.15)', color: GOLD,
                                    border: `2px solid ${GOLD}`,
                                }}
                            >
                                {initials}
                            </Avatar>
                            <Box sx={{
                                position: 'absolute', bottom: 0, right: 0, width: 26, height: 26,
                                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: GOLD, border: `2px solid ${NAVY_DEEP}`,
                            }}>
                                {avatarUploading
                                    ? <CircularProgress size={13} sx={{color: NAVY_DEEP}}/>
                                    : <CameraAltOutlinedIcon sx={{fontSize: 14, color: NAVY_DEEP}}/>}
                            </Box>
                            <input
                                ref={fileInputRef} type="file" hidden
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleAvatarChange}
                            />
                        </Box>
                    </Tooltip>
                    <Box>
                        <Typography sx={{color: '#fff', fontSize: {xs: 22, md: 28}, fontWeight: 800, lineHeight: 1.2}}>
                            {readOnly.name || 'İstifadəçi'}
                        </Typography>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                            <Chip
                                size="small" label={readOnly.username}
                                sx={{backgroundColor: 'rgba(255,255,255,0.08)', color: '#C9D0E6', fontWeight: 600}}
                            />
                            {readOnly.organization && (
                                <Chip
                                    size="small" icon={<ApartmentOutlinedIcon sx={{color: `${GOLD} !important`, fontSize: 16}}/>}
                                    label={readOnly.organization.title}
                                    sx={{backgroundColor: 'rgba(201,162,75,0.12)', color: GOLD, fontWeight: 600}}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* CONTENT */}
            <Box sx={{px: {xs: 2, md: 8}, mt: {xs: -6, md: -7}, position: 'relative', zIndex: 2}}>
                <Grid container spacing={3} sx={{maxWidth: 1040, mx: 'auto'}}>

                    {/* Read-only account info */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{
                            backgroundColor: '#fff', borderRadius: 3, p: {xs: 3, sm: 4},
                            boxShadow: '0 20px 45px rgba(15, 23, 55, 0.08)', height: '100%',
                        }}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.5}}>
                                <VerifiedUserOutlinedIcon sx={{fontSize: 18, color: '#9CA3AF'}}/>
                                <Typography sx={{fontSize: 12.5, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5}}>
                                    Hesab məlumatları
                                </Typography>
                            </Box>
                            <Typography sx={{fontSize: 12.5, color: '#B0B5BF', mb: 1}}>
                                Bu sahələr yalnız sistem administratoru tərəfindən dəyişdirilə bilər.
                            </Typography>

                            <LockedField label="İstifadəçi adı" value={readOnly.username} icon={<PersonOutlineIcon fontSize="small"/>}/>
                            <LockedField label="Email" value={readOnly.email} icon={<MailOutlineIcon fontSize="small"/>}/>
                            <LockedField label="FIN kod" value={readOnly.fin_kod} icon={<BadgeOutlinedIcon fontSize="small"/>}/>
                            {readOnly.organization && (
                                <LockedField label="Qurum" value={readOnly.organization.title} icon={<ApartmentOutlinedIcon fontSize="small"/>}/>
                            )}
                        </Box>
                    </Grid>

                    {/* Editable personal / contact info */}
                    <Grid item xs={12} md={7}>
                        <Box
                            component="form" onSubmit={handleSubmit}
                            sx={{
                                backgroundColor: '#fff', borderRadius: 3, p: {xs: 3, sm: 4},
                                boxShadow: '0 20px 45px rgba(15, 23, 55, 0.08)',
                            }}
                        >
                            <Typography sx={{fontSize: 12.5, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5}}>
                                Şəxsi və əlaqə məlumatları
                            </Typography>
                            <Typography sx={{fontSize: 12.5, color: '#9CA3AF', mb: 1}}>
                                Bu bölmədəki məlumatları özünüz yeniləyə bilərsiniz.
                            </Typography>

                            <TextField
                                fullWidth margin="normal" label="Ad" disabled={saving}
                                value={firstname}
                                onChange={(e) => { setFirstname(e.target.value); setDirty(true); }}
                                error={!!errors.firstname} helperText={errors.firstname}
                                sx={fieldSx(false)}
                                InputProps={{startAdornment: <Box sx={{display: 'flex', mr: 1, color: '#9CA3AF'}}><PersonOutlineIcon fontSize="small"/></Box>}}
                            />
                            <TextField
                                fullWidth margin="normal" label="Soyad" disabled={saving}
                                value={lastname}
                                onChange={(e) => { setLastname(e.target.value); setDirty(true); }}
                                error={!!errors.lastname} helperText={errors.lastname}
                                sx={fieldSx(false)}
                                InputProps={{startAdornment: <Box sx={{display: 'flex', mr: 1, color: '#9CA3AF'}}><PersonOutlineIcon fontSize="small"/></Box>}}
                            />
                            <TextField
                                fullWidth margin="normal" label="Telefon nömrəsi" disabled={saving}
                                value={phoneNumber}
                                onChange={(e) => { setPhoneNumber(e.target.value); setDirty(true); }}
                                error={!!errors.phone_number} helperText={errors.phone_number || 'Əlaqə üçün istifadə olunur'}
                                sx={fieldSx(false)}
                                InputProps={{startAdornment: <Box sx={{display: 'flex', mr: 1, color: '#9CA3AF'}}><LocalPhoneOutlinedIcon fontSize="small"/></Box>}}
                            />
                            <TextField
                                fullWidth margin="normal" label="Doğum tarixi" type="date" disabled={saving}
                                value={birthDate}
                                onChange={(e) => { setBirthDate(e.target.value); setDirty(true); }}
                                InputLabelProps={{shrink: true}}
                                error={!!errors.birth_date} helperText={errors.birth_date}
                                sx={fieldSx(false)}
                                InputProps={{startAdornment: <Box sx={{display: 'flex', mr: 1, color: '#9CA3AF'}}><CalendarMonthOutlinedIcon fontSize="small"/></Box>}}
                            />
                            <TextField
                                fullWidth margin="normal" select label="Cinsiyyət" disabled={saving}
                                value={gender}
                                onChange={(e) => { setGender(e.target.value); setDirty(true); }}
                                error={!!errors.gender} helperText={errors.gender}
                                sx={fieldSx(false)}
                                InputProps={{startAdornment: <Box sx={{display: 'flex', mr: 1, color: '#9CA3AF'}}><WcOutlinedIcon fontSize="small"/></Box>}}
                            >
                                <MenuItem value="">—</MenuItem>
                                {GENDER_OPTIONS.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>

                            <Button
                                type="submit" fullWidth variant="contained" disabled={saving || !dirty}
                                startIcon={saving ? null : <SaveOutlinedIcon/>}
                                sx={{
                                    mt: 3, backgroundColor: NAVY, textTransform: 'none', fontWeight: 700,
                                    py: 1.2, borderRadius: 1.5, letterSpacing: 0.3,
                                    '&:hover': {backgroundColor: '#0B1024'},
                                    '&.Mui-disabled': {backgroundColor: '#D9DCE3', color: '#9CA3AF'},
                                }}
                            >
                                {saving ? <CircularProgress size={20} sx={{color: '#fff'}}/> : 'Yadda saxla'}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}