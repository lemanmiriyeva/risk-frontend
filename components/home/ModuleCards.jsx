"use client"
import React from 'react';
import Link from 'next/link';
import {Box, Skeleton, Typography} from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import {BRAND, C} from "@/components/theme/tokens";
import {moduleAccent, moduleIcon} from "@/components/shell/moduleMeta";
import {panelSx} from "@/components/atoms/bulletin/bulletinShared";

/** Modullar kart şəbəkəsi kimi: hər sətirdə 3 kart (dar ekranda 2/1). */
export default function ModuleCards({modules, loading}) {
    return (
        <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'}}}>
            {loading
                ? [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rounded" height={150} sx={{borderRadius: '12px'}}/>)
                : modules.map((m) => {
                    const Icon = moduleIcon(m.url_endpoint);
                    const accent = moduleAccent(m.url_endpoint);
                    const subs = (m.sub_modules || []).map((s) => s.title).join(' · ');
                    return (
                        <Box key={m.id} component={Link} href={`/${m.url_endpoint}`} sx={{
                            ...panelSx, display: 'flex', flexDirection: 'column', p: 2.5, textDecoration: 'none', color: 'inherit',
                            borderTop: `3px solid ${accent}`, transition: 'box-shadow .2s ease, transform .2s ease',
                            '&:hover': {boxShadow: '0 14px 30px rgba(6,18,38,0.10)', transform: 'translateY(-2px)'},
                            '&:hover .mc-arrow': {transform: 'translateX(4px)', color: accent},
                        }}>
                            <Box sx={{width: 44, height: 44, borderRadius: '10px', mb: 1.75, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: accent, backgroundColor: `${accent}14`}}>
                                <Icon sx={{fontSize: 24}}/>
                            </Box>
                            <Typography sx={{fontSize: 16, fontWeight: 700, color: BRAND.navy900, lineHeight: 1.3}}>{m.title}</Typography>
                            <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.75, lineHeight: 1.5, flex: 1,
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                                {m.description || subs}
                            </Typography>
                            <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 1.5}}>
                                <EastIcon className="mc-arrow" sx={{fontSize: 18, color: C.inkFaint, transition: 'all .25s ease'}}/>
                            </Box>
                        </Box>
                    );
                })}
        </Box>
    );
}
