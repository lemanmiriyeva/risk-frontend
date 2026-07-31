"use client"
import React, {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {handleError} from "@/app/utils";

import bina from "@/app/msn_bina.png"
import logo from "@/app/logo.svg"

import Image from "next/image";
import CssBaseline from "@mui/material/CssBaseline";

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
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                opacity: 1,
                pointerEvents: 'none',
                '& img': {
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }
            }}
        >
            <div style={{position: "absolute", backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1, width: "100%", height: "100%"}}></div>
            <Image
                className={"building"}
                src={bina}
                alt="Bina təsviri"
                layout="responsive"
                width={1000}
                height={1000}
                style={{height: "100%", objectFit: 'cover'}}
            />
        </Box>
    );
}

function hasAnyModuleAccess(permissions = []) {
    return Array.isArray(permissions) && permissions.length > 0;
}

export default function Page() {
    const [qrCode, setQrCode] = useState(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.TWO_FA_SETUP);
                if (res.data?.qr_code) {
                    setQrCode(res.data.qr_code);
                } else if (res.data?.detail) {
                    const {is_approved, permissions = []} = res.data;
                    if (is_approved && hasAnyModuleAccess(permissions)) {
                        router.push(APP_ROUTES.HOME);
                    } else {
                        router.push(APP_ROUTES.PENDING_APPROVAL);
                    }
                }
            } catch (e) {
                setError(handleError(e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleVerify = async (event) => {
        event.preventDefault();
        setVerifying(true);
        setError(null);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TWO_FA_VERIFY, {code});
            enqueueSnackbar('2FA uğurla təsdiqləndi.', {variant: 'success'});

            const {is_approved, permissions = []} = res.data;

            if (is_approved && hasAnyModuleAccess(permissions)) {
                router.push(APP_ROUTES.HOME);
            } else {
                router.push(APP_ROUTES.PENDING_APPROVAL);
            }
        } catch (e) {
            const msg = e?.response?.data?.detail || handleError(e);
            setError(msg);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            position: 'fixed',
            top: 0,
            left: 0
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
                        position: 'relative',
                        flex: {xs: '0 0 0%', md: '0 0 52%'},
                        display: {xs: 'none', md: 'flex'},
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: '#0E1730',
                        color: '#E7EAF3',
                        overflow: 'hidden',
                        px: {md: 6, lg: 8},
                        py: 5,
                    }}
                >
                    <BrandMark/>

                    <Box sx={{position: 'relative', zIndex: 10, mb: 4}}>
                        <Typography
                            sx={{
                                color: '#C9A24B',
                                letterSpacing: 4,
                                fontSize: 13,
                                fontWeight: 600,
                                mb: 1,
                            }}
                        >
                            MİS PLATFORMASI
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: {md: 48, lg: 64},
                                fontWeight: 800,
                                lineHeight: 1,
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                                mb: 2,
                            }}
                        >
                            Mərkəzləşdirilmiş İnformasiya Sistemi
                        </Typography>
                        <Typography sx={{color: '#9AA5C7', maxWidth: 440, fontSize: 15, lineHeight: 1.7}}>
                            Məlumatların vahid platformada təhlükəsiz və səmərəli idarə olunmasını təmin edən informasiya sistemi.
                        </Typography>
                    </Box>

                    <BuildingBlueprint/>
                    <Box sx={{zIndex:10}}>

                    </Box>
                </Box>

                {/* RIGHT — Form Panel */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    overflowY: 'auto',
                    px: 3,
                    pt: {xs: 12, sm: 3, md: 0},
                }}>
                    <Box sx={{
                        width: '100%',
                        maxWidth: 420,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 3,
                        boxShadow: {xs: '0 20px 45px rgba(15, 23, 55, 0.18)', md: 'none'},
                        px: {xs: 3, sm: 4},
                        py: 5
                    }}>
                        <Typography sx={{fontSize: 22, fontWeight: 700, color: '#111827', mb: 0.5}}>
                            İki addımlı təsdiqləmə
                        </Typography>
                        <Typography sx={{fontSize: 14, color: '#6B7280', mb: 3}}>
                            Google Authenticator və ya Microsoft Authenticator tətbiqi ilə aşağıdakı QR kodu skan edin,
                            sonra tətbiqdə göstərilən 6 rəqəmli kodu daxil edin.
                        </Typography>

                        {loading ? (
                            <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                                <CircularProgress size={28}/>
                            </Box>
                        ) : (
                            <>
                                {qrCode && (
                                    <Box sx={{display: 'flex', justifyContent: 'center', mb: 3}}>
                                        <img src={qrCode} alt="2FA QR kod" style={{width: 200, height: 200}}/>
                                    </Box>
                                )}

                                <Box component="form" onSubmit={handleVerify}>
                                    <TextField
                                        fullWidth
                                        required
                                        size="small"
                                        placeholder="6 rəqəmli kod"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        disabled={verifying}
                                        sx={{mb: 2}}
                                    />

                                    {error && (
                                        <Typography sx={{fontSize: 13, color: '#D32F2F', mb: 2}}>
                                            {error}
                                        </Typography>
                                    )}

                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        disabled={verifying || !code}
                                        sx={{
                                            backgroundColor: '#141B33',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            py: 1.1,
                                            borderRadius: 1.5,
                                            '&:hover': {backgroundColor: '#0B1024'},
                                        }}
                                    >
                                        {verifying ? 'Yoxlanılır…' : 'Təsdiqlə'}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>

            </Box>
        </Box>
    );
}