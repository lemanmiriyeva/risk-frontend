"use client"
import React from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Box, Typography, Breadcrumbs} from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {BRAND, C, SERIF_STACK} from "@/components/theme/tokens";
import {growX, reducedMotion, reveal} from "@/components/theme/motion";
import AnimatedPattern from "@/components/shell/AnimatedPattern";
import {moduleAccent, moduleKeyFromPath} from "@/components/shell/moduleMeta";

/**
 * Modul səhifələrinin rəsmi başlığı: serif başlıq, gerb qızılı ilə açılan xətt,
 * fonda yavaş hərəkət edən səkkizguşəli ulduz naxışı.
 *
 * Çörək qırıntısı elementləri URL seqmentlərinə uyğun avtomatik keçidə
 * çevrilir (sonuncu element - cari səhifə - keçidsiz qalır).
 */
export default function ModuleHero({eyebrow, title, subtitle, breadcrumb, icon, actions}) {
    const pathname = usePathname() || '/';
    const segments = pathname.split('/').filter(Boolean);
    const accent = moduleAccent(moduleKeyFromPath(pathname));

    return (
        <Box sx={{
            position: 'relative', overflow: 'hidden',
            background: `linear-gradient(180deg, #FFFFFF 0%, #F7F9FC 100%)`,
            borderBottom: `1px solid ${C.line}`,
        }}>
            <AnimatedPattern color={BRAND.navy800} opacity={0.06} size={104} duration={80} sx={{
                maskImage: 'linear-gradient(100deg, transparent 35%, #000 85%)',
                WebkitMaskImage: 'linear-gradient(100deg, transparent 35%, #000 85%)',
            }}/>
            <Box aria-hidden sx={{
                position: 'absolute', top: -160, right: '8%', width: 460, height: 360, borderRadius: '50%',
                background: `radial-gradient(closest-side, ${accent}1F, transparent)`, pointerEvents: 'none',
            }}/>

            <Box sx={{
                position: 'relative', zIndex: 1,
                px: {xs: 2.5, sm: 4, md: 6}, pt: {xs: 2.5, sm: 3}, pb: {xs: 3.5, sm: 4.5},
                maxWidth: {xs: '100%', sm: '94%', lg: 1400}, mx: 'auto',
            }}>
                {breadcrumb && breadcrumb.length > 0 && (
                    <Breadcrumbs separator={<NavigateNextIcon sx={{fontSize: 15, color: C.inkFaint}}/>} sx={{mb: 2.5, ...reveal(0, 0)}}>
                        <Typography component={Link} href="/" sx={{fontSize: 12.5, fontWeight: 550, color: C.inkMuted, textDecoration: 'none', '&:hover': {color: BRAND.navy900}}}>
                            Ana səhifə
                        </Typography>
                        {breadcrumb.map((b, i) => {
                            const last = i === breadcrumb.length - 1;
                            const href = '/' + segments.slice(0, i + 1).join('/');
                            if (last || i >= segments.length) {
                                return <Typography key={i} sx={{fontSize: 12.5, fontWeight: 650, color: C.ink}}>{b}</Typography>;
                            }
                            return (
                                <Typography key={i} component={Link} href={href}
                                            sx={{fontSize: 12.5, fontWeight: 550, color: C.inkMuted, textDecoration: 'none', '&:hover': {color: BRAND.navy900}}}>
                                    {b}
                                </Typography>
                            );
                        })}
                    </Breadcrumbs>
                )}

                <Box sx={{display: 'flex', alignItems: 'center', gap: {xs: 2, sm: 2.75}, flexWrap: 'wrap'}}>
                    {icon && (
                        <Box sx={{
                            position: 'relative', flexShrink: 0,
                            width: {xs: 56, sm: 68}, height: {xs: 56, sm: 68}, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: accent, backgroundColor: '#fff',
                            border: `1px solid ${accent}40`,
                            boxShadow: `0 0 0 6px ${accent}0D, 0 14px 30px rgba(6,18,38,0.10)`,
                            '& svg': {fontSize: '28px !important'},
                            ...reveal(1, 0),
                        }}>
                            {icon}
                        </Box>
                    )}
                    <Box sx={{minWidth: 0, flex: 1}}>
                        {eyebrow && (
                            <Typography sx={{
                                color: accent, letterSpacing: '0.16em', fontSize: 11, fontWeight: 700,
                                textTransform: 'uppercase', mb: 0.75, ...reveal(2, 0),
                            }}>
                                {eyebrow}
                            </Typography>
                        )}
                        <Typography component="h1" className="serif" sx={{
                            fontFamily: SERIF_STACK, color: BRAND.navy900, fontWeight: 600, letterSpacing: '-0.01em',
                            fontSize: {xs: 26, sm: 32, md: 38}, lineHeight: 1.15, ...reveal(3, 0),
                        }}>
                            {title}
                        </Typography>
                        <Box aria-hidden sx={{
                            mt: 1.5, width: 72, height: 3, borderRadius: 2,
                            background: `linear-gradient(90deg, ${BRAND.crest}, ${BRAND.crest}00)`,
                            transformOrigin: 'left', transform: 'scaleX(0)',
                            animation: `${growX} .9s cubic-bezier(.2,.7,.2,1) .35s forwards`,
                            [reducedMotion]: {animation: 'none', transform: 'none'},
                        }}/>
                        {/* "subtitle" qəsdən göstərilmir - başlıqların altında izah mətni olmasın */}
                    </Box>
                    {actions && <Box sx={{display: 'flex', gap: 1, flexShrink: 0, ...reveal(5, 0)}}>{actions}</Box>}
                </Box>
            </Box>
        </Box>
    );
}
