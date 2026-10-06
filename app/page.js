"use client"
import Link from "next/link";
import {useEffect, useState} from "react";
import {Box, Grid, Typography, Skeleton} from "@mui/material";
import EastIcon from '@mui/icons-material/East';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {useRouter} from "next/navigation";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {useAppSelector} from "@/lib/hooks";
import {BRAND, C, SERIF_STACK, TRICOLOR, formatAzDate} from "@/components/theme/tokens";
import {float, growX, reducedMotion, reveal, sheen} from "@/components/theme/motion";
import {moduleAccent, moduleIcon, useUserModules} from "@/components/shell/moduleMeta";
import AnimatedPattern from "@/components/shell/AnimatedPattern";

const wrapSx = {px: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '94%', lg: 1400}, mx: 'auto'};

function greeting(hour) {
    if (hour < 6) return 'Gecəniz xeyrə qalsın';
    if (hour < 12) return 'Sabahınız xeyir';
    if (hour < 18) return 'Günortanız xeyir';
    return 'Axşamınız xeyir';
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'indicə';
    if (mins < 60) return `${mins} dəq əvvəl`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat əvvəl`;
    return `${Math.floor(hours / 24)} gün əvvəl`;
}

/* Bayraqdakı səkkizguşəli ulduz - hero-da böyük, yavaş hərəkət edən dekor. */
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

function SectionTitle({children, index = 0, aside}) {
    return (
        <Box sx={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3, ...reveal(index, 0.15)}}>
            <Box>
                <Typography component="h2" sx={{fontFamily: SERIF_STACK, fontSize: {xs: 24, sm: 28}, fontWeight: 600, color: BRAND.navy900, letterSpacing: '-0.01em'}}>
                    {children}
                </Typography>
                <Box sx={{mt: 1, width: 56, height: 3, borderRadius: 2, background: TRICOLOR}}/>
            </Box>
            {aside}
        </Box>
    );
}

function ModuleCard({module, index}) {
    const Icon = moduleIcon(module.url_endpoint);
    const accent = moduleAccent(module.url_endpoint);
    const subs = module.sub_modules || [];
    return (
        <Box sx={{
            position: 'relative', height: '100%', display: 'flex', flexDirection: 'column',
            backgroundColor: '#fff', borderRadius: '6px', border: `1px solid ${C.line}`, overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(6,18,38,0.04)',
            transition: 'transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease',
            '&::before': {
                content: '""', position: 'absolute', left: 0, top: 0, right: 0, height: 3, backgroundColor: accent,
                transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform .45s cubic-bezier(.2,.7,.2,1)',
            },
            '&:hover': {transform: 'translateY(-4px)', boxShadow: '0 22px 48px rgba(6,18,38,0.12)'},
            '&:hover::before': {transform: 'scaleX(1)'},
            '&:hover .mc-icon': {backgroundColor: accent, color: '#fff', borderColor: accent},
            '&:hover .mc-arrow': {transform: 'translateX(6px)', color: accent},
            ...reveal(index, 0.25, 0.06),
        }}>
            <Box component={Link} href={`/${module.url_endpoint}`} sx={{p: 3, pb: subs.length ? 2 : 3, textDecoration: 'none', color: 'inherit', flex: 1, display: 'block'}}>
                <Box className="mc-icon" sx={{
                    width: 56, height: 56, borderRadius: '50%', mb: 2.25,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: accent, border: `1px solid ${accent}40`, backgroundColor: `${accent}0D`,
                    transition: 'all .35s ease',
                }}>
                    <Icon sx={{fontSize: 26}}/>
                </Box>
                <Typography sx={{fontFamily: SERIF_STACK, fontSize: 19, fontWeight: 600, color: BRAND.navy900, lineHeight: 1.3}}>
                    {module.title}
                </Typography>
                <Typography sx={{fontSize: 13.5, color: C.inkMuted, mt: 0.75, lineHeight: 1.6}}>
                    {module.description || `${module.title} bölməsinə keçid.`}
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: C.inkMuted}}>
                    <Typography sx={{fontSize: 13, fontWeight: 650, letterSpacing: '0.02em'}}>Daxil ol</Typography>
                    <EastIcon className="mc-arrow" sx={{fontSize: 17, transition: 'transform .3s ease, color .3s ease'}}/>
                </Box>
            </Box>
            {subs.length > 0 && (
                <Box sx={{borderTop: `1px solid ${C.line}`, backgroundColor: C.surfaceRaised}}>
                    {subs.map((s, i) => (
                        <Box key={s.id} component={Link} href={`/${module.url_endpoint}/${s.url_endpoint}`} sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 3, py: 1.1, textDecoration: 'none', borderTop: i ? `1px solid ${C.line}` : 'none',
                            color: C.inkMuted, fontSize: 13, fontWeight: 550,
                            transition: 'color .2s ease, padding-left .25s ease, background-color .2s ease',
                            '&:hover': {color: accent, pl: 3.75, backgroundColor: '#fff'},
                        }}>
                            {s.title}
                            <EastIcon sx={{fontSize: 14, opacity: 0.5}}/>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default function Home() {
    const user = useAppSelector((state) => state.user);
    const router = useRouter();
    const {modules, loading} = useUserModules();
    const [notes, setNotes] = useState({items: [], loading: true});
    const [now, setNow] = useState(null);

    useEffect(() => {
        setNow(new Date());
        (async () => {
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.NOTIFICATIONS.LIST}?page=1&page_size=4`);
                setNotes({items: res.data?.results || [], loading: false});
            } catch {
                setNotes({items: [], loading: false});
            }
        })();
    }, []);

    const firstName = user?.firstname || '';

    if (!loading && modules.length === 0) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3}}>
                <Box sx={{textAlign: 'center', maxWidth: 440, ...reveal(0)}}>
                    <Box sx={{width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${C.lineStrong}`, color: C.inkMuted}}>
                        <LockOutlinedIcon sx={{fontSize: 30}}/>
                    </Box>
                    <Typography sx={{fontFamily: SERIF_STACK, fontSize: 24, fontWeight: 600, color: BRAND.navy900, mb: 1}}>Giriş icazəniz yoxdur</Typography>
                    <Typography sx={{fontSize: 14.5, color: C.inkMuted, lineHeight: 1.6}}>
                        Hesabınıza heç bir modula giriş icazəsi verilməyib. Zəhmət olmasa sistem administratoru ilə əlaqə saxlayın.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{pb: 8}}>
            {/* Rəsmi giriş bloku */}
            <Box sx={{
                position: 'relative', overflow: 'hidden', color: '#fff',
                background: `radial-gradient(90% 120% at 85% 10%, ${BRAND.navy600} 0%, ${BRAND.navy900} 55%, ${BRAND.navy950} 100%)`,
            }}>
                <AnimatedPattern opacity={0.045} size={120} duration={90}/>
                <Box aria-hidden sx={{
                    position: 'absolute', right: {xs: -160, md: '6%'}, top: {xs: -40, md: -30},
                    animation: `${float} 14s ease-in-out infinite`, [reducedMotion]: {animation: 'none'},
                }}>
                    <Star size={420} color="#E9C766" opacity={0.22}/>
                </Box>
                <Box aria-hidden sx={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
                    <Box sx={{
                        position: 'absolute', top: 0, bottom: 0, width: '30%',
                        background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.06), transparent)',
                        animation: `${sheen} 9s ease-in-out 1s infinite`, [reducedMotion]: {display: 'none'},
                    }}/>
                </Box>

                <Box sx={{...wrapSx, position: 'relative', py: {xs: 6, sm: 8, md: 10}}}>
                    <Typography sx={{fontSize: 13, color: '#A9B6CC', letterSpacing: '0.04em', ...reveal(0, 0.05)}}>
                        {now ? formatAzDate(now) : ' '}
                    </Typography>
                    <Typography sx={{mt: 1.5, fontSize: {xs: 16, sm: 18}, color: '#E9C766', fontWeight: 550, ...reveal(1, 0.05)}}>
                        {now ? greeting(now.getHours()) : 'Xoş gəlmisiniz'}{firstName ? `, ${firstName}` : ''}
                    </Typography>
                    <Typography component="h1" className="serif" sx={{
                        fontFamily: SERIF_STACK, mt: 1, maxWidth: 820,
                        fontSize: {xs: 32, sm: 44, md: 54}, fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.015em',
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
                    <Typography sx={{mt: 3, maxWidth: 640, fontSize: {xs: 15, sm: 16.5}, color: '#C3CDDD', lineHeight: 1.7, ...reveal(3, 0.05)}}>
                        Azərbaycan Respublikası Müdafiə Sənayesi Nazirliyinin vahid elektron idarəetmə platforması.
                        Səlahiyyətinizə uyğun bölmələr aşağıda təqdim olunub.
                    </Typography>
                </Box>
            </Box>

            {/* Modullar */}
            <Box sx={{...wrapSx, mt: {xs: 5, md: 7}}}>
                <SectionTitle aside={!loading && (
                    <Typography sx={{fontSize: 13, color: C.inkFaint, ...reveal(1, 0.15)}}>{modules.length} bölmə</Typography>
                )}>
                    Bölmələr
                </SectionTitle>
                <Grid container spacing={3}>
                    {loading
                        ? [0, 1, 2, 3, 4, 5].map((i) => (
                            <Grid item xs={12} sm={6} lg={4} key={i}>
                                <Skeleton variant="rounded" height={230} sx={{borderRadius: '6px'}}/>
                            </Grid>
                        ))
                        : modules.map((m, i) => (
                            <Grid item xs={12} sm={6} lg={4} key={m.id}>
                                <ModuleCard module={m} index={i}/>
                            </Grid>
                        ))}
                </Grid>
            </Box>

            {/* Son bildirişlər */}
            {!notes.loading && notes.items.length > 0 && (
                <Box sx={{...wrapSx, mt: {xs: 6, md: 8}}}>
                    <SectionTitle index={0} aside={(
                        <Typography component={Link} href="/bildirisler" sx={{fontSize: 13.5, fontWeight: 650, color: BRAND.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0.5}}>
                            Bütün bildirişlər <EastIcon sx={{fontSize: 16}}/>
                        </Typography>
                    )}>
                        Son bildirişlər
                    </SectionTitle>
                    <Box sx={{backgroundColor: '#fff', border: `1px solid ${C.line}`, borderRadius: '6px', overflow: 'hidden'}}>
                        {notes.items.map((n, i) => (
                            <Box key={n.id} onClick={() => n.link && router.push(n.link)} sx={{
                                display: 'flex', alignItems: 'center', gap: 2.5, px: 3, py: 2,
                                borderTop: i ? `1px solid ${C.line}` : 'none', cursor: n.link ? 'pointer' : 'default',
                                transition: 'background-color .2s ease',
                                '&:hover': {backgroundColor: C.surfaceRaised},
                                ...reveal(i, 0.2, 0.06),
                            }}>
                                <Box sx={{width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                                    backgroundColor: n.is_read ? C.lineStrong : BRAND.crest,
                                    boxShadow: n.is_read ? 'none' : `0 0 0 4px ${BRAND.crestSoft}`}}/>
                                <Box sx={{flex: 1, minWidth: 0}}>
                                    <Typography sx={{fontSize: 14.5, fontWeight: n.is_read ? 550 : 700, color: C.ink}} noWrap>{n.title}</Typography>
                                    {n.body && <Typography sx={{fontSize: 13, color: C.inkMuted}} noWrap>{n.body}</Typography>}
                                </Box>
                                <Typography sx={{fontSize: 12, color: C.inkFaint, flexShrink: 0}}>{timeAgo(n.created_at)}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
