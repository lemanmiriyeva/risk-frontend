"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';
import Link from '@mui/material/Link';
import {ThemeProvider} from '@mui/material/styles';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import Image from "next/image";
import appTheme from "@/components/theme/appTheme";
import {BRAND, C, FONT_STACK, TRICOLOR} from "@/components/theme/tokens";
import {float, growX, reducedMotion, reveal} from "@/components/theme/motion";
import AnimatedPattern from "@/components/shell/AnimatedPattern";
import bina from "@/app/msn_bina.png";
import logo from "@/app/logo.svg";

/*
 * Giriş axını səhifələri (giriş, şifrə təyini, 2FA qurulması, təsdiq gözləmə)
 * üçün ortaq karkas: solda Nazirliyin brend paneli, sağda forma kartı.
 */

export const SUPPORT_EMAIL = 'itsupport@mdi.gov.az';

/* Səkkizguşəli ulduz (bayraqdakı motiv) - fon bəzəyi. */
function Star({size = 320, color = '#FFFFFF', opacity = 0.10}) {
    const h = size / 2, r1 = size * 0.48, r2 = size * 0.22;
    const pts = Array.from({length: 16}, (_, i) => {
        const r = i % 2 ? r2 : r1;
        const a = (Math.PI / 8) * i - Math.PI / 2;
        return `${(h + r * Math.cos(a)).toFixed(1)},${(h + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <polygon points={pts} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="1.5"/>
            <circle cx={h} cy={h} r={r2 * 0.75} fill="none" stroke={color} strokeOpacity={opacity * 0.8} strokeWidth="1"/>
        </svg>
    );
}

function BrandMark({height = 44}) {
    return (
        <Box sx={{position: 'relative', width: height * 5.45, maxWidth: '100%', height, flexShrink: 0}}>
            <Image src={logo} alt="Azərbaycan Respublikasının Müdafiə Sənayesi Nazirliyi" fill priority
                   style={{objectFit: 'contain', objectPosition: 'left center'}}/>
        </Box>
    );
}

const FEATURES = [
    {Icon: ShieldOutlinedIcon, title: 'Təhlükəsiz giriş', text: 'İki mərhələli doğrulama və domen hesabı ilə.'},
    {Icon: HubOutlinedIcon, title: 'Vahid platforma', text: 'Risklər, inventar, icazələr, elanlar və təlimlər bir yerdə.'},
    {Icon: HistoryOutlinedIcon, title: 'Şəffaf tarixçə', text: 'Hər əməliyyat hərəkət tarixçəsində qeydə alınır.'},
];

/* Sol tərəf - rəsmi brend paneli (yalnız md+ ekranlarda). */
function BrandPanel() {
    return (
        <Box sx={{
            position: 'relative', overflow: 'hidden', color: '#fff',
            flex: '0 0 56%', display: {xs: 'none', md: 'flex'}, flexDirection: 'column',
            background: `radial-gradient(110% 90% at 85% 15%, ${BRAND.navy600} 0%, ${BRAND.navy900} 52%, ${BRAND.navy950} 100%)`,
            px: {md: 6, lg: 9}, py: {md: 5, lg: 6},
        }}>
            <AnimatedPattern opacity={0.04} size={120} duration={110}/>

            {/* Nazirliyin binası - fonda solğun */}
            <Box aria-hidden sx={{
                position: 'absolute', right: '-4%', bottom: 0, width: '66%', opacity: 0.2,
                mixBlendMode: 'screen',
                maskImage: 'radial-gradient(ellipse 75% 85% at 65% 100%, #000 35%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 75% 85% at 65% 100%, #000 35%, transparent 100%)',
                pointerEvents: 'none',
                '& img': {width: '100%', height: 'auto', display: 'block', filter: 'grayscale(1)'},
            }}>
                <Image src={bina} alt="" priority/>
            </Box>

            <Box aria-hidden sx={{
                position: 'absolute', right: {md: -120, lg: -60}, top: {md: 40, lg: 20},
                animation: `${float} 16s ease-in-out infinite`, [reducedMotion]: {animation: 'none'},
            }}>
                <Star size={460} color="#E9C766" opacity={0.18}/>
            </Box>

            <Box sx={{position: 'relative', ...reveal(0, 0.05)}}>
                <BrandMark height={46}/>
            </Box>

            <Box sx={{position: 'relative', my: 'auto', py: 6, maxWidth: 620}}>
                <Typography sx={{fontSize: 12.5, fontWeight: 700, letterSpacing: '0.18em', color: '#E9C766', textTransform: 'uppercase', ...reveal(1, 0.05)}}>
                    MİS platforması
                </Typography>
                <Typography component="h1" sx={{
                    mt: 2, fontSize: {md: 44, lg: 56}, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em',
                    ...reveal(2, 0.05),
                }}>
                    Mərkəzləşdirilmiş İnformasiya Sistemi
                </Typography>
                <Box aria-hidden sx={{
                    mt: 3, width: 120, height: 3, background: TRICOLOR, borderRadius: 2,
                    transformOrigin: 'left', transform: 'scaleX(0)',
                    animation: `${growX} 1s cubic-bezier(.2,.7,.2,1) .5s forwards`,
                    [reducedMotion]: {animation: 'none', transform: 'none'},
                }}/>
                <Typography sx={{mt: 3, fontSize: 16, lineHeight: 1.75, color: '#C3CDDD', maxWidth: 520, ...reveal(3, 0.05)}}>
                    Azərbaycan Respublikası Müdafiə Sənayesi Nazirliyinin məlumatlarının vahid platformada
                    təhlükəsiz və səmərəli idarə olunmasını təmin edən informasiya sistemi.
                </Typography>

                <Box sx={{mt: 5, display: 'flex', flexDirection: 'column', gap: 2.25}}>
                    {FEATURES.map(({Icon, title, text}, i) => (
                        <Box key={title} sx={{display: 'flex', alignItems: 'flex-start', gap: 1.75, ...reveal(4 + i, 0.05)}}>
                            <Box sx={{
                                width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                color: '#E9C766',
                            }}>
                                <Icon sx={{fontSize: 20}}/>
                            </Box>
                            <Box>
                                <Typography sx={{fontSize: 14.5, fontWeight: 650, color: '#fff'}}>{title}</Typography>
                                <Typography sx={{fontSize: 13.5, color: '#A9B6CC', mt: 0.25}}>{text}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Typography sx={{position: 'relative', fontSize: 12.5, color: '#8C9BB5'}}>
                © {new Date().getFullYear()} Azərbaycan Respublikasının Müdafiə Sənayesi Nazirliyi
            </Typography>
            <Box aria-hidden sx={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: TRICOLOR}}/>
        </Box>
    );
}

export function FieldLabel({htmlFor, children}) {
    return (
        <Typography component="label" htmlFor={htmlFor} sx={{display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, mb: 0.75}}>
            {children}
        </Typography>
    );
}

export const authFieldSx = {
    '& .MuiOutlinedInput-root': {borderRadius: '10px', backgroundColor: '#fff', fontSize: 15},
    '& .MuiOutlinedInput-input': {py: 1.5},
};

export const authPrimaryButtonSx = {
    py: 1.5, borderRadius: '10px', fontSize: 15, fontWeight: 650,
    backgroundColor: BRAND.navy900,
    '&:hover': {backgroundColor: BRAND.navy700},
    '&.Mui-disabled': {backgroundColor: BRAND.navy700, color: 'rgba(255,255,255,0.8)'},
};

export const authLinkSx = {fontSize: 13, fontWeight: 600, color: BRAND.accent};

export function AuthError({children}) {
    if (!children) return null;
    return (
        <Box role="alert" sx={{
            mb: 2.5, px: 1.75, py: 1.25, borderRadius: '10px',
            backgroundColor: C.dangerTint, border: '1px solid rgba(196,47,61,0.25)',
        }}>
            <Typography sx={{fontSize: 13, color: C.danger, fontWeight: 500}}>{children}</Typography>
        </Box>
    );
}

/* Kartın altındakı dəstək mətni */
export function SupportNote({children}) {
    return (
        <Box sx={{mt: 3.5, pt: 2.5, borderTop: `1px solid ${C.line}`}}>
            <Typography sx={{fontSize: 12.5, color: C.inkMuted, lineHeight: 1.6}}>
                {children || 'Problem yaranarsa, İnformasiya texnologiyaları şöbəsinə müraciət edin:'}{' '}
                <Link href={`mailto:${SUPPORT_EMAIL}`} underline="hover" sx={{fontWeight: 600, color: BRAND.accent}}>
                    {SUPPORT_EMAIL}
                </Link>
            </Typography>
        </Box>
    );
}

/**
 * icon     - kartın yuxarısındakı ikon
 * title    - başlıq
 * subtitle - başlığın altındakı izah
 * align    - 'left' | 'center'
 */
export default function AuthLayout({icon, title, subtitle, align = 'left', maxWidth = 440, children, footer}) {
    const center = align === 'center';
    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#F3F6FA', fontFamily: FONT_STACK}}>
                <CssBaseline/>

                <BrandPanel/>

                <Box sx={{flex: '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative'}}>
                    {/* Mobil başlıq */}
                    <Box sx={{
                        display: {xs: 'flex', md: 'none'}, alignItems: 'center', px: 2.5, py: 2, position: 'relative',
                        background: `linear-gradient(120deg, ${BRAND.navy950}, ${BRAND.navy800})`,
                    }}>
                        <BrandMark height={34}/>
                        <Box aria-hidden sx={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: TRICOLOR}}/>
                    </Box>

                    <Box sx={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: {xs: 2, sm: 4}, py: {xs: 5, md: 6}}}>
                        <Box sx={{width: '100%', maxWidth, ...reveal(1, 0.1)}}>
                            <Box sx={{
                                position: 'relative', overflow: 'hidden', textAlign: center ? 'center' : 'left',
                                backgroundColor: '#FFFFFF', borderRadius: '18px', border: `1px solid ${C.line}`,
                                boxShadow: '0 24px 60px rgba(10,27,54,0.10)',
                                px: {xs: 3, sm: 5}, pt: {xs: 4, sm: 5}, pb: {xs: 3.5, sm: 4.5},
                            }}>
                                <Box aria-hidden sx={{position: 'absolute', left: 0, right: 0, top: 0, height: 4, background: TRICOLOR}}/>

                                {icon && (
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: '14px', mb: 2.5, mx: center ? 'auto' : 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: BRAND.accentSoft, color: BRAND.accent,
                                    }}>
                                        {icon}
                                    </Box>
                                )}

                                <Typography component="h2" sx={{fontSize: 24, fontWeight: 700, color: BRAND.navy900, letterSpacing: '-0.01em'}}>
                                    {title}
                                </Typography>
                                {subtitle && (
                                    <Typography sx={{fontSize: 14, color: C.inkMuted, mt: 0.75, mb: 3.5, lineHeight: 1.6}}>
                                        {subtitle}
                                    </Typography>
                                )}

                                {children}

                                {footer}
                            </Box>

                            <Typography sx={{display: {xs: 'block', md: 'none'}, textAlign: 'center', mt: 3, fontSize: 12, color: C.inkFaint}}>
                                © {new Date().getFullYear()} Azərbaycan Respublikasının Müdafiə Sənayesi Nazirliyi
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
