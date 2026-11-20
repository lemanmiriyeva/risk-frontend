"use client"
import Box from '@mui/material/Box';
import {driftFor, reducedMotion} from "@/components/theme/motion";
import crest from "./crest-pattern-white.png";

/*
 * Tünd fonda (sidebar) çox zəif, seyrək və yavaş sürüşən gerb (loqodakı ikon) naxışı.
 * Gerb xananın ~13%-ni tutur (kiçik), xana isə geniş götürülür (CELL_SCALE) ki, gerblər az olsun.
 * `size` xananın əsas ölçüsüdür (böyütsəniz gerblər daha seyrək olur), `opacity` isə solğunluğu.
 */
const CELL_SCALE = 2.2;

export default function AnimatedPattern({opacity = 0.08, size = 170, duration = 120, sx}) {
    const cell = Math.round(size * CELL_SCALE);
    return (
        <Box aria-hidden sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `url(${crest.src})`, backgroundSize: `${cell}px ${cell}px`, opacity,
            animation: `${driftFor(cell)} ${Math.round(duration * CELL_SCALE)}s linear infinite`,
            [reducedMotion]: {animation: 'none'},
            ...sx,
        }}/>
    );
}