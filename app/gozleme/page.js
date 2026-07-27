"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CssBaseline from "@mui/material/CssBaseline";
import Image from "next/image";

import bina from "@/app/msn_bina.png"
import logo from "@/app/logo.svg"

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
                    height: '100%',
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
                        REYESTR PLATFORMASI
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: {md: 48, lg: 64},
                            fontWeight: 800,
                            lineHeight: 1,
                            letterSpacing: 1,
                            mb: 2,
                        }}
                    >
                        RİSK REYESTR SİSTEMİ
                    </Typography>
                    <Typography sx={{color: '#9AA5C7', maxWidth: 440, fontSize: 15, lineHeight: 1.7}}>
                        İstehsal, təchizat və sənəd dövriyyəsi proseslərinin vahid idarəetmə mühiti.
                        Giriş yalnız sistem administratoru tərəfindən yaradılmış hesablar üçün mümkündür.
                    </Typography>
                </Box>

                <BuildingBlueprint/>
                <Box sx={{zIndex: 10, fontSize: 13, color: '#9AA5C7'}}>
                    CopyRight
                </Box>
            </Box>

            {/* RIGHT — Content Panel */}
            <Box sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: '#EEF1F5',
                overflowY: 'auto',
                px: 3,
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
                    <Typography sx={{fontSize: 14, color: '#6B7280'}}>
                        İki addımlı təsdiqləmə uğurla tamamlandı. Sistemə tam giriş üçün admininizlə əlaqə saxlayın.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}