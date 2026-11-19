"use client"
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import {Box, IconButton, Skeleton, Typography} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {BRAND, C} from "@/components/theme/tokens";
import {EmptyState, panelSx} from "@/components/atoms/bulletin/bulletinShared";

const TAG_COLORS = {news: '#0A6CC2', announcement: '#C42F3D', event: '#1F7A4D', other: '#6B7280'};
const DEFAULT_TAG = '#4B5563'; // sənəd kateqoriyaları (Sərəncam, Fərman, ...)
const PER_SLIDE = 3;           // bir slaydda (bir sütunda) 3 elan
const AUTOPLAY_MS = 8000;
const SWIPE_PX = 40;

function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('az-AZ', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

function chunk(list, size) {
    const out = [];
    for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
}

function FeedItem({item, first, active}) {
    const color = TAG_COLORS[item.type] || DEFAULT_TAG;
    return (
        <Box component={Link} href={item.link || '/elanlar'} draggable={false} tabIndex={active ? 0 : -1} sx={{
            display: 'block', px: 2, py: 1.5, borderTop: first ? 'none' : `1px solid ${C.line}`, textDecoration: 'none', color: 'inherit',
            '&:hover': {backgroundColor: C.surfaceRaised},
        }}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.5}}>
                <Box component="span" sx={{
                    fontSize: 10.5, fontWeight: 700, px: 0.9, py: '2px', borderRadius: '6px',
                    color, backgroundColor: `${color}1A`, textTransform: 'uppercase', letterSpacing: '0.03em',
                }}>{item.type_label}</Box>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>{formatDate(item.date)}</Typography>
            </Box>
            <Typography sx={{
                fontSize: 13.5, fontWeight: 650, color: C.ink, lineHeight: 1.35,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{item.title}</Typography>
            {item.summary && (
                <Typography sx={{fontSize: 12.5, color: C.inkMuted, mt: 0.25, display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{item.summary}</Typography>
            )}
        </Box>
    );
}

/**
 * Ana səhifədə "Elanlar" slider-i: bir sütunda eyni anda 3 elan görünür, oxlar / nöqtələr /
 * sürüşdürmə ilə növbəti 3-lüyə keçilir. Siz üzərinə gələndə avtomatik keçid dayanır.
 */
export default function HomeFeed() {
    const [state, setState] = useState({items: [], loading: true});
    const [page, setPage] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchX = useRef(null);

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

    const slides = useMemo(() => chunk(state.items, PER_SLIDE), [state.items]);
    const count = slides.length;

    const go = useCallback((next) => {
        if (count < 2) return;
        setPage(((next % count) + count) % count);
    }, [count]);

    // Avtomatik keçid (istifadəçi hərəkət azaltma seçibsə söndürülür)
    useEffect(() => {
        if (count < 2 || paused) return undefined;
        if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
        const t = setInterval(() => setPage((p) => (p + 1) % count), AUTOPLAY_MS);
        return () => clearInterval(t);
    }, [count, paused]);

    const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > SWIPE_PX) go(page + (dx < 0 ? 1 : -1));
    };

    return (
        <Box sx={{...panelSx, overflow: 'hidden'}}
             onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
             onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.75, pb: 1.25}}>
                <Typography component="h2" sx={{fontSize: 15, fontWeight: 700, color: BRAND.navy900}}>Elanlar</Typography>
                {count > 1 && (
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.25}}>
                        <Typography sx={{fontSize: 11.5, color: C.inkFaint, mr: 0.5}} aria-live="polite">{page + 1} / {count}</Typography>
                        <IconButton size="small" aria-label="Əvvəlki elanlar" onClick={() => go(page - 1)}><ChevronLeftIcon fontSize="small"/></IconButton>
                        <IconButton size="small" aria-label="Növbəti elanlar" onClick={() => go(page + 1)}><ChevronRightIcon fontSize="small"/></IconButton>
                    </Box>
                )}
            </Box>

            {state.loading ? (
                <Box sx={{px: 2, pb: 2}}>{[0, 1, 2].map((i) => <Skeleton key={i} height={64}/>)}</Box>
            ) : count === 0 ? (
                <Box sx={{py: 4}}><EmptyState title="Hələ elan yoxdur"/></Box>
            ) : (
                <>
                    <Box sx={{overflow: 'hidden', borderTop: `1px solid ${C.line}`}} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                        <Box sx={{
                            display: 'flex', transform: `translateX(-${page * 100}%)`,
                            transition: 'transform .45s cubic-bezier(.2,.7,.2,1)',
                            '@media (prefers-reduced-motion: reduce)': {transition: 'none'},
                        }}>
                            {slides.map((group, i) => (
                                <Box key={i} aria-hidden={i !== page} sx={{flex: '0 0 100%', minWidth: 0}}>
                                    {group.map((it, j) => <FeedItem key={it.id} item={it} first={j === 0} active={i === page}/>)}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderTop: `1px solid ${C.line}`}}>
                        <Box sx={{display: 'flex', gap: 0.75}} role="tablist" aria-label="Elan səhifələri">
                            {slides.map((_, i) => (
                                <Box key={i} component="button" type="button" role="tab" aria-selected={i === page}
                                     aria-label={`${i + 1}-ci səhifə`} onClick={() => go(i)} sx={{
                                    p: 0, border: 'none', cursor: 'pointer', height: 6, borderRadius: 3,
                                    width: i === page ? 20 : 6, backgroundColor: i === page ? BRAND.navy600 : C.lineStrong,
                                    transition: 'all .25s ease',
                                }}/>
                            ))}
                        </Box>
                        <Box component={Link} href="/elanlar" sx={{fontSize: 12.5, fontWeight: 600, color: BRAND.navy600, textDecoration: 'none'}}>
                            Hamısı →
                        </Box>
                    </Box>
                </>
            )}
        </Box>
    );
}
