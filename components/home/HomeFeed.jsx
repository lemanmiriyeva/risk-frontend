"use client"
import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import {Box, Skeleton, Typography} from '@mui/material';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {BRAND, C} from "@/components/theme/tokens";
import {EmptyState, panelSx} from "@/components/atoms/bulletin/bulletinShared";

const TAG_COLORS = {news: '#0A6CC2', announcement: '#C42F3D', event: '#1F7A4D', other: '#6B7280'};
const DEFAULT_TAG = '#4B5563'; // sənəd kateqoriyaları (Sərəncam, Fərman, ...)

function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('az-AZ', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

/** Ana səhifədə "Elanlar": xəbər/elan/tədbir və sənədlər, hər biri növ teqi ilə. */
export default function HomeFeed() {
    const [state, setState] = useState({items: [], loading: true});

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.AGENDA.FEED);
                setState({items: res.data || [], loading: false});
            } catch {
                setState({items: [], loading: false});
            }
        })();
    }, []);

    return (
        <Box sx={{...panelSx, overflow: 'hidden'}}>
            <Box sx={{px: 2, pt: 2, pb: 1.25}}>
                <Typography component="h2" sx={{fontSize: 15, fontWeight: 700, color: BRAND.navy900}}>Elanlar</Typography>
            </Box>
            {state.loading ? (
                <Box sx={{px: 2, pb: 2}}>{[0, 1, 2].map((i) => <Skeleton key={i} height={64}/>)}</Box>
            ) : state.items.length === 0 ? (
                <Box sx={{py: 4}}><EmptyState title="Hələ elan yoxdur"/></Box>
            ) : state.items.map((it) => {
                const color = TAG_COLORS[it.type] || DEFAULT_TAG;
                return (
                    <Box key={it.id} component={Link} href={it.link || '/elanlar'} sx={{
                        display: 'block', px: 2, py: 1.5, borderTop: `1px solid ${C.line}`, textDecoration: 'none', color: 'inherit',
                        '&:hover': {backgroundColor: C.surfaceRaised},
                    }}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.5}}>
                            <Box component="span" sx={{
                                fontSize: 10.5, fontWeight: 700, px: 0.9, py: '2px', borderRadius: '6px',
                                color, backgroundColor: `${color}1A`, textTransform: 'uppercase', letterSpacing: '0.03em',
                            }}>{it.type_label}</Box>
                            <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>{formatDate(it.date)}</Typography>
                        </Box>
                        <Typography sx={{fontSize: 13.5, fontWeight: 650, color: C.ink, lineHeight: 1.35}}>{it.title}</Typography>
                        {it.summary && (
                            <Typography sx={{fontSize: 12.5, color: C.inkMuted, mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{it.summary}</Typography>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
