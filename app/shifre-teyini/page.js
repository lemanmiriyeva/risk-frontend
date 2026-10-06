"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from "@mui/material/CircularProgress";
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {useRouter, useSearchParams} from "next/navigation";
import {useSnackbar} from "notistack";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {handleError} from "@/app/utils";
import AuthLayout, {FieldLabel, SupportNote, authFieldSx, authLinkSx, authPrimaryButtonSx} from "@/components/shell/AuthLayout";

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {enqueueSnackbar} = useSnackbar();

    const [username, setUsername] = useState(searchParams.get('username') || '');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    function validate() {
        const errs = {};
        if (!username) errs.username = 'İstifadəçi adı və ya email tələb olunur';
        if (!code) errs.code = 'Mailinizə gələn kodu daxil edin';
        if (!newPassword || newPassword.length < 8) errs.newPassword = 'Şifrə ən azı 8 simvol olmalıdır';
        if (newPassword !== confirmPassword) errs.confirmPassword = 'Şifrələr uyğun gəlmir';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.RESET, {
                username, code, new_password: newPassword,
            });
            enqueueSnackbar('Şifrəniz uğurla yeniləndi. İndi daxil ola bilərsiniz.', {variant: 'success'});
            router.push(APP_ROUTES.SIGNIN);
        } catch (err) {
            enqueueSnackbar(err?.response?.data?.detail || handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }

    const toggle = (
        <InputAdornment position="end">
            <IconButton size="small" edge="end" onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}>
                {showPassword ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
            </IconButton>
        </InputAdornment>
    );

    return (
        <AuthLayout
            icon={<KeyOutlinedIcon/>}
            title="Şifrənin təyin edilməsi"
            subtitle="E-poçt ünvanınıza göndərilən bir dəfəlik kodu və yeni şifrənizi daxil edin."
            footer={<SupportNote/>}
        >
            <Box component="form" onSubmit={handleSubmit} noValidate>
                <FieldLabel htmlFor="username">İstifadəçi adı və ya elektron poçt</FieldLabel>
                <TextField
                    fullWidth id="username" disabled={loading} placeholder="məs. ad.soyad"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    error={!!errors.username} helperText={errors.username}
                    sx={{...authFieldSx, mb: 2.25}}
                />

                <FieldLabel htmlFor="code">E-poçta gələn kod</FieldLabel>
                <TextField
                    fullWidth id="code" disabled={loading} placeholder="000000" autoComplete="one-time-code"
                    value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    error={!!errors.code} helperText={errors.code}
                    inputProps={{maxLength: 6, inputMode: 'numeric', style: {letterSpacing: 8, fontWeight: 700}}}
                    sx={{...authFieldSx, mb: 2.25}}
                />

                <FieldLabel htmlFor="new-password">Yeni şifrə</FieldLabel>
                <TextField
                    fullWidth id="new-password" type={showPassword ? 'text' : 'password'} disabled={loading}
                    autoComplete="new-password" placeholder="Ən azı 8 simvol"
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    error={!!errors.newPassword} helperText={errors.newPassword}
                    InputProps={{endAdornment: toggle}}
                    sx={{...authFieldSx, mb: 2.25}}
                />

                <FieldLabel htmlFor="confirm-password">Yeni şifrə (təkrar)</FieldLabel>
                <TextField
                    fullWidth id="confirm-password" type={showPassword ? 'text' : 'password'} disabled={loading}
                    autoComplete="new-password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                    sx={{...authFieldSx, mb: 3}}
                />

                <Button type="submit" fullWidth variant="contained" disabled={loading} sx={authPrimaryButtonSx}>
                    {loading
                        ? <><CircularProgress size={18} sx={{color: '#fff', mr: 1.25}}/>Yenilənir…</>
                        : 'Şifrəni yenilə'}
                </Button>

                <Box sx={{textAlign: 'center', mt: 2}}>
                    <Link component="button" type="button" underline="hover" sx={authLinkSx}
                          onClick={() => router.push(APP_ROUTES.SIGNIN)} disabled={loading}>
                        ← Giriş səhifəsinə qayıt
                    </Link>
                </Box>
            </Box>
        </AuthLayout>
    );
}