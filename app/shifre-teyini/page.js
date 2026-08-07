"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CssBaseline from "@mui/material/CssBaseline";
import CircularProgress from "@mui/material/CircularProgress";
import Image from "next/image";
import {useRouter, useSearchParams} from "next/navigation";
import {useSnackbar} from "notistack";

import bina from "@/app/msn_bina.png"
import logo from "@/app/logo.svg"
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {handleError} from "@/app/utils";

function BrandMark() {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, zIndex: "10"}}>
            <Image src={logo} alt={""}/>
        </Box>
    );
}

function BuildingBlueprint() {
    return (
        <Box
            sx={{
                position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '100%',
                opacity: 1, pointerEvents: 'none',
                '& img': {width: '100%', height: '100%', objectFit: 'cover'}
            }}
        >
            <div style={{position: "absolute", backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1, width: "100%", height: "100%"}}></div>
            <Image className={"building"} src={bina} alt="Bina təsviri" layout="responsive" width={1000} height={1000}
                   style={{height: "100%", objectFit: 'cover'}}/>
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {enqueueSnackbar} = useSnackbar();

    const [username, setUsername] = useState(searchParams.get('username') || '');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

    return (
        <Box sx={{
            display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
            backgroundColor: '#FFFFFF', position: 'fixed', top: 0, left: 0
        }}>
            <CssBaseline/>

            {/* Mobile-only full-bleed background (desktop uses the dedicated left panel instead) */}
            <Box sx={{display: {xs: 'block', md: 'none'}, position: 'absolute', inset: 0, zIndex: 0}}>
                <BuildingBlueprint/>
            </Box>
            <Box sx={{display: {xs: 'flex', md: 'none'}, position: 'absolute', top: 20, left: 20, zIndex: 2}}>
                <BrandMark/>
            </Box>

            <Box sx={{display: 'flex', width: '100%', height: '100%', position: 'relative', zIndex: 1, flexDirection: {xs: 'column', md: 'row'}}}>

                {/* LEFT — Brand Panel */}
                <Box
                    sx={{
                        position: 'relative', flex: {xs: '0 0 0%', md: '0 0 52%'}, display: {xs: 'none', md: 'flex'},
                        flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#0E1730',
                        color: '#E7EAF3', overflow: 'hidden', px: {md: 6, lg: 8}, py: 5,
                    }}
                >
                    <BrandMark/>
                    <Box sx={{position: 'relative', zIndex: 10, mb: 4}}>
                        <Typography sx={{color: '#C9A24B', letterSpacing: 4, fontSize: 13, fontWeight: 600, mb: 1}}>
                            MİS PLATFORMASI
                        </Typography>
                        <Typography sx={{
                            fontSize: {md: 48, lg: 64}, fontWeight: 800, lineHeight: 1,
                            textTransform: 'uppercase', letterSpacing: 1, mb: 2,
                        }}>
                            Şifrəni Təyin Et
                        </Typography>
                        <Typography sx={{color: '#9AA5C7', maxWidth: 440, fontSize: 15, lineHeight: 1.7}}>
                            E-poçt ünvanınıza göndərilən kodu daxil edib özünüz üçün yeni şifrə seçin.
                        </Typography>
                    </Box>
                    <BuildingBlueprint/>
                </Box>

                {/* RIGHT — Form Panel */}
                <Box sx={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', backgroundColor: {xs: 'transparent', md: '#EEF1F5'}, overflowY: 'auto', px: 3,
                    pt: {xs: 12, sm: 3, md: 0},
                }}>
                    <Box
                        component="form" onSubmit={handleSubmit}
                        sx={{
                            width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 3,
                            boxShadow: '0 20px 45px rgba(15, 23, 55, 0.08)', px: {xs: 3, sm: 5}, py: 5,
                        }}
                    >
                        <Typography sx={{fontSize: 22, fontWeight: 700, color: '#111827', mb: 0.5}}>
                            Şifrəni təyin et
                        </Typography>
                        <Typography sx={{fontSize: 13.5, color: '#6B7280', mb: 3}}>
                            Mailinizə gələn kodu və yeni şifrənizi daxil edin.
                        </Typography>

                        <TextField
                            fullWidth margin="normal" label="İstifadəçi adı və ya email" disabled={loading}
                            value={username} onChange={(e) => setUsername(e.target.value)}
                            error={!!errors.username} helperText={errors.username}
                        />
                        <TextField
                            fullWidth margin="normal" label="Mailə gələn kod" disabled={loading}
                            value={code} onChange={(e) => setCode(e.target.value)}
                            error={!!errors.code} helperText={errors.code}
                            inputProps={{maxLength: 6, inputMode: 'numeric'}}
                        />
                        <TextField
                            fullWidth margin="normal" label="Yeni şifrə" type="password" disabled={loading}
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            error={!!errors.newPassword} helperText={errors.newPassword}
                        />
                        <TextField
                            fullWidth margin="normal" label="Yeni şifrə (təkrar)" type="password" disabled={loading}
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            error={!!errors.confirmPassword} helperText={errors.confirmPassword}
                        />

                        <Button
                            type="submit" fullWidth variant="contained" disabled={loading}
                            sx={{
                                mt: 3, backgroundColor: '#141B33', textTransform: 'none', fontWeight: 600,
                                py: 1.1, borderRadius: 1.5, '&:hover': {backgroundColor: '#0B1024'},
                            }}
                        >
                            {loading ? <CircularProgress size={20} sx={{color: '#fff'}}/> : 'Şifrəni yenilə'}
                        </Button>

                        <Button
                            onClick={() => router.push(APP_ROUTES.SIGNIN)} fullWidth variant="text" disabled={loading}
                            sx={{mt: 1.5, textTransform: 'none', color: '#6B7280'}}
                        >
                            Giriş səhifəsinə qayıt
                        </Button>
                    </Box>
                </Box>

            </Box>
        </Box>
    );
}