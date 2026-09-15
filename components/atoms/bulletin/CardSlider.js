"use client"
import React, {useEffect, useMemo, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {C} from "./bulletinShared";

/**
 * Bir slaydda bir kart göstərən karusel.
 *
 * props:
 *  - items        : massiv
 *  - renderItem   : (item, index) => JSX
 *  - height       : slayd sahəsinin sabit hündürlüyü (px)
 *  - loop         : sonuncudan birinciyə keçid (default true)
 *  - emptyState   : siyahı boş olanda göstəriləcək JSX
 *  - headerSlot   : başlıq sətri (ikon, ad, say) - oxlar avtomatik sağda yerləşir
 *  - footerSlot   : altdakı düymə (məs. "Hamısına bax")
 */
export default function CardSlider({
                                       items = [],
                                       renderItem,
                                       height = 260,
                                       loop = true,
                                       emptyState = null,
                                       headerSlot = null,
                                       footerSlot = null,
                                   }) {
    const [index, setIndex] = useState(0);
    const touchStart = useRef(null);
    const count = items.length;

    const reduceMotion = useMemo(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    useEffect(() => {
        if (index > count - 1) setIndex(count > 0 ? count - 1 : 0);
    }, [count, index]);

    function go(step) {
        if (count === 0) return;
        setIndex((i) => {
            const next = i + step;
            if (next < 0) return loop ? count - 1 : 0;
            if (next > count - 1) return loop ? 0 : count - 1;
            return next;
        });
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            go(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            go(1);
        }
    }

    function handleTouchStart(e) {
        touchStart.current = e.touches[0].clientX;
    }

    function handleTouchEnd(e) {
        if (touchStart.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
        touchStart.current = null;
    }

    const arrowSx = {
        width: 26, height: 26, borderRadius: '7px', color: C.inkMuted,
        border: `1px solid ${C.line}`, backgroundColor: C.surface,
        '&:hover': {backgroundColor: C.surfaceRaised, borderColor: C.lineStrong, color: C.ink},
        '&.Mui-disabled': {color: C.line, borderColor: C.line},
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            {/* Başlıq + naviqasiya */}
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, px: 2, pt: 2, pb: 1.5}}>
                <Box sx={{minWidth: 0, flex: 1}}>{headerSlot}</Box>
                {count > 1 && (
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0}}>
                        <Typography sx={{fontSize: 11, color: C.inkFaint, fontWeight: 600, mr: 0.25}}>
                            {index + 1}/{count}
                        </Typography>
                        <IconButton size="small" onClick={() => go(-1)} aria-label="Əvvəlki" sx={arrowSx}
                                    disabled={!loop && index === 0}>
                            <ChevronLeftIcon sx={{fontSize: 17}}/>
                        </IconButton>
                        <IconButton size="small" onClick={() => go(1)} aria-label="Növbəti" sx={arrowSx}
                                    disabled={!loop && index === count - 1}>
                            <ChevronRightIcon sx={{fontSize: 17}}/>
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* Slayd sahəsi */}
            {count === 0 ? (
                <Box sx={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: height}}>
                    {emptyState}
                </Box>
            ) : (
                <Box
                    tabIndex={0}
                    role="group"
                    aria-roledescription="karusel"
                    onKeyDown={handleKeyDown}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    sx={{
                        overflow: 'hidden', px: 2, outline: 'none',
                        '&:focus-visible': {boxShadow: `inset 0 0 0 2px ${C.gold}`, borderRadius: '10px'},
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        transform: `translateX(-${index * 100}%)`,
                        transition: reduceMotion ? 'none' : 'transform .35s cubic-bezier(.4,0,.2,1)',
                    }}>
                        {items.map((item, i) => (
                            <Box key={item?.id ?? i}
                                 aria-hidden={i !== index}
                                 sx={{flex: '0 0 100%', minWidth: 0, height, pr: 0}}>
                                {renderItem(item, i)}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Nöqtələr */}
            {count > 1 && (
                <Box sx={{display: 'flex', justifyContent: 'center', gap: 0.6, px: 2, pt: 1.5}}>
                    {items.slice(0, 8).map((_, i) => (
                        <Box key={i} onClick={() => setIndex(i)}
                             sx={{
                                 width: i === index ? 16 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
                                 backgroundColor: i === index ? C.gold : C.lineStrong,
                                 transition: 'width .25s ease, background-color .25s ease',
                             }}/>
                    ))}
                    {count > 8 && (
                        <Typography sx={{fontSize: 10, color: C.inkFaint, ml: 0.5, lineHeight: '6px'}}>
                            +{count - 8}
                        </Typography>
                    )}
                </Box>
            )}

            <Box sx={{flexGrow: 1}}/>
            {footerSlot && <Box sx={{px: 2, py: 1.75, mt: 1.5, borderTop: `1px solid ${C.line}`}}>{footerSlot}</Box>}
        </Box>
    );
}