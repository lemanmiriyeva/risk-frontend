"use client"
import Box from '@mui/material/Box';
import {starPattern} from "@/components/theme/tokens";
import {driftFor, reducedMotion} from "@/components/theme/motion";

/* Fonda yavaş sürüşən səkkizguşəli ulduz naxışı (ayrıca qat - qradiyent sabit qalır). */
export default function AnimatedPattern({color = '#FFFFFF', opacity = 0.05, size = 120, duration = 60, sx}) {
    return (
        <Box aria-hidden sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: starPattern(color, opacity, size), backgroundSize: `${size}px ${size}px`,
            animation: `${driftFor(size)} ${duration}s linear infinite`,
            [reducedMotion]: {animation: 'none'},
            ...sx,
        }}/>
    );
}
