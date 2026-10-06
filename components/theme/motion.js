"use client"
import {keyframes} from '@emotion/react';

/*
 * Ortaq animasiyalar. Hamısı `prefers-reduced-motion` ayarına hörmət edir:
 * istifadəçi sistemdə animasiyanı söndürübsə, elementlər dərhal görünür.
 */
export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

export const drift = keyframes`
  from { background-position: 0 0; }
  to   { background-position: 240px 120px; }
`;

export const sheen = keyframes`
  0%   { transform: translateX(-120%); }
  60%, 100% { transform: translateX(220%); }
`;

export const growX = keyframes`
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
`;

export const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-10px) rotate(6deg); }
`;

const reduce = '@media (prefers-reduced-motion: reduce)';

/** Ardıcıl görünmə: `reveal(i)` sx obyektinə əlavə olunur. */
export function reveal(index = 0, base = 0.05, step = 0.07) {
    return {
        opacity: 0,
        animation: `${fadeUp} .7s cubic-bezier(.2,.7,.2,1) ${base + index * step}s forwards`,
        [reduce]: {animation: 'none', opacity: 1},
    };
}

export const reducedMotion = reduce;

/** Naxış ölçüsünə uyğun sürüşmə - dövr sonunda tikiş (sıçrayış) görünmür. */
const driftCache = {};
export function driftFor(size) {
    if (!driftCache[size]) {
        driftCache[size] = keyframes`
          from { background-position: 0 0; }
          to   { background-position: ${size * 2}px ${size}px; }
        `;
    }
    return driftCache[size];
}
