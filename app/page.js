"use client"
import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {Box, Grid, Typography, Skeleton, Button} from "@mui/material";
import EastIcon from '@mui/icons-material/East';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import {useRouter} from "next/navigation";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {BRAND, C, TRICOLOR} from "@/components/theme/tokens";
import {float, growX, reducedMotion, reveal, sheen} from "@/components/theme/motion";
import {moduleAccent, moduleIcon, useUserModules} from "@/components/shell/moduleMeta";
import AnimatedPattern from "@/components/shell/AnimatedPattern";
import CardSlider from "@/components/atoms/bulletin/CardSlider";
import {
    BDAY_SLIDE_H, BirthdaySlide, CircularSlide, DOC_SLIDE_H, NEWS_SLIDE_H, NewsPairSlide, PanelTitle, pairNews,
} from "@/components/atoms/bulletin/BulletinBoard";
import {CategoryIcon, EmptyState, panelSx, softButtonSx, useBulletinCategories} from "@/components/atoms/bulletin/bulletinShared";

const wrapSx = {px: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '94%', lg: 1440}, mx: 'auto'};

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

/* Sol sütun - modulların yığcam siyahısı */
function ModulesPanel({modules, loading}) {
    return (
        <Box sx={{...panelSx, overflow: 'hidden'}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 2, pb: 1.5}}>
                <PanelTitle icon={<Box component="span" sx={{width: 10, height: 10, transform: 'rotate(45deg)', backgroundColor: BRAND.accent}}/>}
                            title="Bölmələr" count={loading ? undefined : modules.length}/>
            </Box>
            <Box sx={{pb: 1}}>
                {loading
                    ? [0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} variant="rounded" height={52} sx={{mx: 2, mb: 1, borderRadius: '10px'}}/>)
                    : modules.map((m, i) => {
                        const Icon = moduleIcon(m.url_endpoint);
                        const accent = moduleAccent(m.url_endpoint);
                        return (
                            <Box key={m.id} component={Link} href={`/${m.url_endpoint}`} sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5, mx: 1, px: 1.25, py: 1.1,
                                borderRadius: '10px', textDecoration: 'none', color: 'inherit',
                                transition: 'background-color .2s ease',
                                '&:hover': {backgroundColor: C.surfaceRaised},
                                '&:hover .ml-arrow': {transform: 'translateX(4px)', color: accent, opacity: 1},
                                '&:hover .ml-icon': {backgroundColor: accent, color: '#fff'},
                                ...reveal(i, 0.2, 0.04),
                            }}>
                                <Box className="ml-icon" sx={{
                                    width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: accent, backgroundColor: `${accent}12`, transition: 'all .25s ease',
                                }}>
                                    <Icon sx={{fontSize: 20}}/>
                                </Box>
                                <Box sx={{flex: 1, minWidth: 0}}>
                                    <Typography noWrap sx={{fontSize: 14, fontWeight: 650, color: BRAND.navy900}}>{m.title}</Typography>
                                    {m.sub_modules?.length > 0 && (
                                        <Typography noWrap sx={{fontSize: 12, color: C.inkFaint}}>
                                            {m.sub_modules.map((s) => s.title).join(' · ')}
                                        </Typography>
                                    )}
                                </Box>
                                <EastIcon className="ml-arrow" sx={{fontSize: 16, color: C.inkFaint, opacity: 0.6, transition: 'all .25s ease'}}/>
                            </Box>
                        );
                    })}
            </Box>
        </Box>
    );
}

/* Elanlar lövhəsinə girişi olmayanlar üçün orta sütunda son bildirişlər */
function NotificationsPanel() {
    const router = useRouter();
    const [notes, setNotes] = useState({items: [], loading: true});
    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.NOTIFICATIONS.LIST}?page=1&page_size=6`);
                setNotes({items: res.data?.results || [], loading: false});
            } catch {
                setNotes({items: [], loading: false});
            }
        })();
    }, []);
    return (
        <Box sx={panelSx}>
            <Box sx={{px: 2, pt: 2, pb: 1.5}}>
                <PanelTitle size="lg" icon={<NotificationsNoneOutlinedIcon sx={{fontSize: 20}}/>} title="Son bildirişlər"/>
            </Box>
            {notes.loading ? (
                <Box sx={{px: 2, pb: 2}}>{[0, 1, 2].map((i) => <Skeleton key={i} height={56}/>)}</Box>
            ) : notes.items.length === 0 ? (
                <Box sx={{py: 6}}><EmptyState title="Yeni bildiriş yoxdur"/></Box>
            ) : notes.items.map((n) => (
                <Box key={n.id} onClick={() => n.link && router.push(n.link)} sx={{
                    display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.75, borderTop: `1px solid ${C.line}`,
                    cursor: n.link ? 'pointer' : 'default', '&:hover': {backgroundColor: C.surfaceRaised},
                }}>
                    <Box sx={{width: 9, height: 9, borderRadius: '50%', flexShrink: 0, backgroundColor: n.is_read ? C.lineStrong : BRAND.crest}}/>
                    <Box sx={{flex: 1, minWidth: 0}}>
                        <Typography noWrap sx={{fontSize: 14, fontWeight: n.is_read ? 550 : 700, color: C.ink}}>{n.title}</Typography>
                        {n.body && <Typography noWrap sx={{fontSize: 12.5, color: C.inkMuted}}>{n.body}</Typography>}
                    </Box>
                    <Typography sx={{fontSize: 12, color: C.inkFaint, flexShrink: 0}}>{timeAgo(n.created_at)}</Typography>
                </Box>
            ))}
            <Box sx={{px: 2, py: 1.75, borderTop: `1px solid ${C.line}`}}>
                <Button fullWidth size="small" component={Link} href="/bildirisler" sx={softButtonSx}>Bütün bildirişlər</Button>
            </Box>
        </Box>
    );
}

export default function Home() {
    const {modules, loading} = useUserModules();
    const hasBulletin = modules.some((m) => m.url_endpoint === 'elanlar');
    const [board, setBoard] = useState({data: null, loading: true});
    const {categories} = useBulletinCategories(hasBulletin);

    // Elanlar lövhəsinin məlumatı yalnız həmin modula girişi olanlar üçün yüklənir
    // (əks halda 403 cavabı service.js-də giriş səhifəsinə yönləndirməyə səbəb olur).
    useEffect(() => {
        if (loading) return;
        if (!hasBulletin) { setBoard({data: null, loading: false}); return; }
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.DASHBOARD);
                setBoard({data: res.data, loading: false});
            } catch {
                setBoard({data: null, loading: false});
            }
        })();
    }, [loading, hasBulletin]);

    const newsPairs = useMemo(() => pairNews(board.data?.news || []), [board.data]);
    const birthdays = useMemo(
        () => [...(board.data?.birthdays || [])].sort((a, b) => (b.is_today ? 1 : 0) - (a.is_today ? 1 : 0)),
        [board.data],
    );

    if (!loading && modules.length === 0) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3}}>
                <Box sx={{textAlign: 'center', maxWidth: 440, ...reveal(0)}}>
                    <Box sx={{width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${C.lineStrong}`, color: C.inkMuted}}>
                        <LockOutlinedIcon sx={{fontSize: 30}}/>
                    </Box>
                    <Typography sx={{fontSize: 24, fontWeight: 600, color: BRAND.navy900, mb: 1}}>Giriş icazəniz yoxdur</Typography>
                    <Typography sx={{fontSize: 14.5, color: C.inkMuted, lineHeight: 1.6}}>
                        Hesabınıza heç bir modula giriş icazəsi verilməyib. Zəhmət olmasa sistem administratoru ilə əlaqə saxlayın.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{pb: 8}}>
            {/* Rəsmi giriş bloku - yalnız başlıq */}
            <Box sx={{
                position: 'relative', overflow: 'hidden', color: '#fff',
                background: `radial-gradient(90% 120% at 85% 10%, ${BRAND.navy600} 0%, ${BRAND.navy900} 55%, ${BRAND.navy950} 100%)`,
            }}>
                <AnimatedPattern opacity={0.045} size={120} duration={90}/>
                <Box aria-hidden sx={{
                    position: 'absolute', right: {xs: -180, md: '6%'}, top: {xs: -120, md: -150},
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

                <Box sx={{...wrapSx, position: 'relative', py: {xs: 5, sm: 6, md: 7}}}>
                    <Typography component="h1" sx={{
                        maxWidth: 820, fontSize: {xs: 30, sm: 40, md: 48}, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em',
                        ...reveal(0, 0.05),
                    }}>
                        Mərkəzləşdirilmiş İnformasiya Sistemi
                    </Typography>
                    <Box aria-hidden sx={{
                        mt: 2.5, width: 120, height: 3, background: TRICOLOR, borderRadius: 2,
                        transformOrigin: 'left', transform: 'scaleX(0)',
                        animation: `${growX} 1s cubic-bezier(.2,.7,.2,1) .4s forwards`,
                        [reducedMotion]: {animation: 'none', transform: 'none'},
                    }}/>
                </Box>
            </Box>

            {/* Sol: modullar · Orta: xəbərlər · Sağ: ad günləri və sənədlər */}
            <Box sx={{...wrapSx, mt: {xs: 4, md: 5}}}>
                <Grid container spacing={2.5} alignItems="flex-start">
                    <Grid item xs={12} md={hasBulletin ? 3 : 4}>
                        <ModulesPanel modules={modules} loading={loading}/>
                    </Grid>

                    {hasBulletin ? (
                        <>
                            <Grid item xs={12} md={6}>
                                <Box sx={{...panelSx, ...reveal(1, 0.15)}}>
                                    {board.loading ? (
                                        <Box sx={{p: 2}}><Skeleton variant="rounded" height={NEWS_SLIDE_H}/></Box>
                                    ) : (
                                        <CardSlider
                                            items={newsPairs}
                                            height={NEWS_SLIDE_H}
                                            emptyState={<EmptyState icon={<NewspaperOutlinedIcon sx={{fontSize: 34}}/>} title="Hələ xəbər dərc edilməyib"/>}
                                            headerSlot={<PanelTitle size="lg" icon={<NewspaperOutlinedIcon sx={{fontSize: 20}}/>} title="Xəbərlər" count={board.data?.news?.length || 0}/>}
                                            renderItem={(pair) => <NewsPairSlide items={pair.items}/>}
                                            footerSlot={<Button fullWidth size="small" component={Link} href="/elanlar/xeberler" sx={softButtonSx}>Bütün xəbərlər</Button>}
                                        />
                                    )}
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <Box sx={{display: 'flex', flexDirection: 'column', gap: 2.5, ...reveal(2, 0.15)}}>
                                    <Box sx={panelSx}>
                                        {board.loading ? (
                                            <Box sx={{p: 2}}><Skeleton variant="rounded" height={BDAY_SLIDE_H}/></Box>
                                        ) : (
                                            <CardSlider
                                                items={birthdays}
                                                height={BDAY_SLIDE_H}
                                                emptyState={<EmptyState icon={<CakeOutlinedIcon sx={{fontSize: 32}}/>} title="Bu ay ad günü olan əməkdaş yoxdur"/>}
                                                headerSlot={<PanelTitle icon={<CakeOutlinedIcon sx={{fontSize: 17}}/>} title="Ad günləri" count={birthdays.length}/>}
                                                renderItem={(person) => <BirthdaySlide person={person}/>}
                                                footerSlot={<Button fullWidth size="small" component={Link} href="/elanlar/ad-gunleri" sx={softButtonSx}>Ad günü təqvimi</Button>}
                                            />
                                        )}
                                    </Box>

                                    {categories.map((cat) => {
                                        const list = board.data?.circulars?.[cat.key] || [];
                                        return (
                                            <Box key={cat.id} sx={panelSx}>
                                                <CardSlider
                                                    items={list}
                                                    height={DOC_SLIDE_H}
                                                    emptyState={<EmptyState title="Bu bölmədə sənəd yoxdur"/>}
                                                    headerSlot={<PanelTitle icon={<CategoryIcon icon={cat.icon}/>} title={cat.plural_label || cat.label} count={list.length}/>}
                                                    renderItem={(item) => <CircularSlide item={item}/>}
                                                    footerSlot={(
                                                        <Button fullWidth size="small" component={Link} href={`/elanlar/senedler?category=${cat.key}`}
                                                                sx={{...softButtonSx, fontSize: 11.5, py: 0.6}}>
                                                            {list.length > 1 ? `Hamısına bax (${list.length})` : 'Bölməyə keç'}
                                                        </Button>
                                                    )}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12} md={8}>
                            <NotificationsPanel/>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Box>
    );
}
