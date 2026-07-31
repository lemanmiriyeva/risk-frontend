"use client"
import React, {useEffect, useState, useCallback} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CssBaseline from "@mui/material/CssBaseline";
import Image from "next/image";
import {useRouter} from "next/navigation";

import bina from "@/app/msn_bina.png"
import logo from "@/app/logo.svg"
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";

const CHECK_INTERVAL_MS = 10000; // hər 10 saniyədə bir yoxla

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

export default function Page() {
    const router = useRouter();
    const [checking, setChecking] = useState(false);

    const checkAccess = useCallback(async () => {
        setChecking(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER);
            const {is_approved, permissions = []} = res.data || {};
            if (is_approved && Array.isArray(permissions) && permissions.length > 0) {
                router.push(APP_ROUTES.HOME);
            }
        } catch (e) {
            // sükutla keç, növbəti interval-da yenidən cəhd olunacaq
        } finally {
            setChecking(false);
        }
    }, [router]);

    useEffect(() => {
        checkAccess();
        const interval = setInterval(checkAccess, CHECK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [checkAccess]);

    const handleBackToSignIn = () => {
        router.push(APP_ROUTES.SIGNIN);
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

                {/* RIGHT — Content Panel */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    backgroundColor: {xs: 'transparent', md: '#EEF1F5'},
                    overflowY: 'auto',
                    px: 3,
                    pt: {xs: 12, sm: 3, md: 0},
                }}>
                    <Box sx={{
                        width: '100%',
                        maxWidth: 420,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 3,
                        boxShadow: '0 20px 45px rgba(15, 23, 55, 0.08)',
                        px: {xs: 3, sm: 5},
                        py: 5,
                        textAlign: 'center'
                    }}>
                        <Typography sx={{fontSize: 22, fontWeight: 700, color: '#111827', mb: 1.5}}>
                            Giriş icazəsi gözlənilir
                        </Typography>
                        <Typography sx={{fontSize: 14, color: '#6B7280', mb: 3}}>
                            İki addımlı təsdiqləmə uğurla tamamlandı. Sistemə tam giriş üçün admininizlə əlaqə saxlayın.
                        </Typography>

                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3}}>
                            {checking && <CircularProgress size={14}/>}
                            <Typography sx={{fontSize: 12, color: '#9CA3AF'}}>
                                İcazə statusu avtomatik yoxlanılır…
                            </Typography>
                        </Box>

                        <Button
                            onClick={handleBackToSignIn}
                            fullWidth
                            variant="outlined"
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                py: 1.1,
                                borderRadius: 1.5,
                                borderColor: '#141B33',
                                color: '#141B33',
                                '&:hover': {borderColor: '#0B1024', backgroundColor: 'rgba(20,27,51,0.04)'},
                            }}
                        >
                            Giriş səhifəsinə qayıt
                        </Button>
                    </Box>
                </Box>

            </Box>
        </Box>
    );
}