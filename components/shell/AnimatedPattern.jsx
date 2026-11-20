"use client"
import Box from '@mui/material/Box';
import {driftFor, reducedMotion} from "@/components/theme/motion";
import crestWhite from "./crest-pattern-white.png";
import crestColor from "./crest-pattern-color.png";

/*
 * Fonda yavaş sürüşən gerb (loqodakı ikon) naxışı. Ayrıca qatdır - qradiyent sabit qalır.
 *   - color='#FFFFFF' (defolt): tünd fon üçün ağ xətt versiyası
 *   - başqa rəng verilsə: açıq fon üçün rəngli gerb
 * `size` əvvəlki ulduz naxışı ilə eyni məna daşıyır (sıxlıq). Gerb xananın ~20%-ni tutur (kiçik),
 * xana isə geniş götürülür (CELL_SCALE) ki, gerblər az və aralı olsun; sürüşmə sürəti eyni qalsın
 * deyə müddət də xananın böyüməsinə uyğun artırılır.
 */
const CELL_SCALE = 2.2;
const isWhite = (c) => String(c).replace('#', '').toUpperCase() === 'FFFFFF';

export default function AnimatedPattern({color = '#FFFFFF', opacity = 0.05, size = 120, duration = 60, sx}) {
    const onDark = isWhite(color);
    const tile = onDark ? crestWhite : crestColor;
    const cell = Math.round(size * CELL_SCALE);
    // Əvvəlki "zəif xətt" opaklığı şəkil üçün uyğunlaşdırılır
    const alpha = Math.min(1, opacity * (onDark ? 2.4 : 1.8));
    return (
        <Box aria-hidden sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: `url(${tile.src})`, backgroundSize: `${cell}px ${cell}px`, opacity: alpha,
            animation: `${driftFor(cell)} ${Math.round(duration * CELL_SCALE)}s linear infinite`,
            [reducedMotion]: {animation: 'none'},
            ...sx,
        }}/>
    );
}
