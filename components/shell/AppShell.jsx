"use client"
import React, {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname, useRouter} from 'next/navigation';
import {ThemeProvider} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Popper from '@mui/material/Popper';
import Fade from '@mui/material/Fade';
import Collapse from '@mui/material/Collapse';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import {useAppSelector} from "@/lib/hooks";
import {APP_ROUTES} from "@/components/constants";
import NotificationBell from "@/components/atoms/NotificationBell";
import appTheme from "@/components/theme/appTheme";
import {BRAND, C, FONT_STACK, SERIF_STACK, TRICOLOR, formatNumericDate} from "@/components/theme/tokens";
import {fadeIn, reducedMotion} from "@/components/theme/motion";
import {moduleAccent, moduleIcon, moduleKeyFromPath, useUserModules} from "./moduleMeta";
import AnimatedPattern from "./AnimatedPattern";
import logo from '@/app/logo.png';

const SIDEBAR_W = 268;
const SIDEBAR_W_COLLAPSED = 76;
const SIDEBAR_STORAGE_KEY = 'mis.sidebar.collapsed';
const MOBILE_QUERY = '(max-width:1099px)';
/* Başlığın hündürlüyü (sürüşdürəndə kiçilir) - sidebar onun altından başlayır. */
const headerHeight = (scrolled) => (scrolled ? 60 : 76) + 3;


function fullName(user) {
    return [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.username || '';
}

function initials(user) {
    return `${(user?.firstname || '')[0] || ''}${(user?.lastname || '')[0] || ''}`.toUpperCase() || '—';
}

function roleLabel(user) {
    if (user?.is_superuser) return 'Sistem administratoru';
    if (user?.is_org_admin) return 'Qurum admini';
    return user?.role?.title || user?.organization?.title || '';
}

/* ------------------------------------------------------------------ */
/*  İstifadəçi menyusu                                                 */
/* ------------------------------------------------------------------ */

function UserMenu({compact}) {
    const user = useAppSelector(({user}) => user);
    const router = useRouter();
    const [anchor, setAnchor] = useState(null);
    const go = (route) => { setAnchor(null); router.push(route); };

    return (
        <>
            <Box onClick={(e) => setAnchor(e.currentTarget)} sx={{
                display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer',
                pl: 0.5, pr: compact ? 0.5 : 1.25, py: 0.5, borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.14)',
                backgroundColor: anchor ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                transition: 'background-color .2s ease, border-color .2s ease',
                '&:hover': {backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(201,154,30,0.6)'},
            }}>
                <Avatar src={user?.image || undefined} sx={{
                    width: 34, height: 34, fontSize: 13, fontWeight: 700,
                    bgcolor: BRAND.crest, color: BRAND.navy950,
                }}>
                    {user?.isLoaded === false ? '' : initials(user)}
                </Avatar>
                {!compact && (
                    <Box sx={{minWidth: 0, maxWidth: 190}}>
                        <Typography sx={{fontSize: 13.5, fontWeight: 650, color: '#fff', lineHeight: 1.2}} noWrap>
                            {fullName(user) || <Skeleton width={100} sx={{bgcolor: 'rgba(255,255,255,0.15)'}}/>}
                        </Typography>
                        <Typography sx={{fontSize: 11.5, color: '#A9B6CC', lineHeight: 1.3}} noWrap>{roleLabel(user)}</Typography>
                    </Box>
                )}
                {!compact && <KeyboardArrowDownIcon sx={{color: '#A9B6CC', fontSize: 18,
                    transform: anchor ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease'}}/>}
            </Box>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} TransitionComponent={Fade}
                  anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} transformOrigin={{vertical: 'top', horizontal: 'right'}}
                  slotProps={{paper: {sx: {mt: 1.25, minWidth: 250}}}}>
                <Box sx={{px: 2, py: 1.5}}>
                    <Typography sx={{fontSize: 14, fontWeight: 700, color: C.ink}} noWrap>{fullName(user)}</Typography>
                    <Typography sx={{fontSize: 12.5, color: C.inkMuted}} noWrap>{user?.email}</Typography>
                </Box>
                <Divider/>
                <MenuItem onClick={() => go(APP_ROUTES.PROFILE)} sx={{py: 1.1}}>
                    <ListItemIcon><PersonOutlineIcon fontSize="small"/></ListItemIcon>
                    <Typography sx={{fontSize: 14, fontWeight: 550}}>Şəxsi kabinet</Typography>
                </MenuItem>
                <MenuItem onClick={() => go(APP_ROUTES.NOTIFICATIONS)} sx={{py: 1.1}}>
                    <ListItemIcon><NotificationsNoneOutlinedIcon fontSize="small"/></ListItemIcon>
                    <Typography sx={{fontSize: 14, fontWeight: 550}}>Bildirişlər</Typography>
                </MenuItem>
                <Divider/>
                <MenuItem onClick={() => go(APP_ROUTES.SIGNOUT)} sx={{py: 1.1, color: C.danger}}>
                    <ListItemIcon><LogoutIcon fontSize="small" sx={{color: C.danger}}/></ListItemIcon>
                    <Typography sx={{fontSize: 14, fontWeight: 600}}>Çıxış</Typography>
                </MenuItem>
            </Menu>
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Sol sidebar (modullar + açılan alt bölmələr, yığıla bilir)         */
/* ------------------------------------------------------------------ */

const isPathActive = (pathname, href) => pathname === href || pathname.startsWith(href + '/');

const scrollbarSx = {
    '&::-webkit-scrollbar': {width: 6},
    '&::-webkit-scrollbar-thumb': {backgroundColor: C.lineStrong, borderRadius: 3},
};

/** Açıq sidebar: ikon + ad, alt bölmələr akkordeon kimi açılır. */
function ExpandedItem({href, label, Icon, accent, active, subs = [], pathname, open, onToggle, baseHref}) {
    return (
        <Box sx={{mb: 0.25}}>
            <Box sx={{
                position: 'relative', display: 'flex', alignItems: 'center', borderRadius: '10px',
                backgroundColor: active ? `${accent}14` : 'transparent', transition: 'background-color .15s ease',
                '&:hover': {backgroundColor: active ? `${accent}1F` : C.surfaceDeep},
            }}>
                {active && <Box sx={{position: 'absolute', left: 0, top: 9, bottom: 9, width: 3, borderRadius: 3, backgroundColor: accent}}/>}
                <Box component={Link} href={href} aria-current={active ? 'page' : undefined} sx={{
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5, pl: 1.75, py: 1.05,
                    textDecoration: 'none', fontSize: 14, fontWeight: active ? 700 : 550, color: active ? accent : C.ink,
                }}>
                    <Icon sx={{fontSize: 21, flexShrink: 0, color: active ? accent : C.inkMuted}}/>
                    <Box component="span" sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{label}</Box>
                </Box>
                {subs.length > 0 && (
                    <IconButton size="small" onClick={onToggle} aria-expanded={open} aria-label={`${label} alt bölmələri`} sx={{mr: 0.5, color: C.inkMuted}}>
                        <KeyboardArrowDownIcon fontSize="small" sx={{transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease'}}/>
                    </IconButton>
                )}
            </Box>
            {subs.length > 0 && (
                <Collapse in={open} timeout={200} unmountOnExit>
                    <Box sx={{ml: 3.25, pl: 1, my: 0.5, borderLeft: `2px solid ${C.line}`}}>
                        {subs.map((s) => {
                            const subHref = `${baseHref}/${s.url_endpoint}`;
                            const subActive = isPathActive(pathname, subHref);
                            return (
                                <Box key={s.id} component={Link} href={subHref} aria-current={subActive ? 'page' : undefined} sx={{
                                    display: 'block', px: 1.5, py: 0.8, my: '1px', borderRadius: '8px', textDecoration: 'none',
                                    fontSize: 13.5, fontWeight: subActive ? 650 : 500, color: subActive ? accent : C.inkMuted,
                                    backgroundColor: subActive ? `${accent}12` : 'transparent',
                                    '&:hover': {backgroundColor: `${accent}0F`, color: accent},
                                }}>
                                    {s.title}
                                </Box>
                            );
                        })}
                    </Box>
                </Collapse>
            )}
        </Box>
    );
}

/** Yığılmış sidebar: yalnız ikon; alt bölməsi olan modulun üzərinə gələndə sağda açılan siyahı. */
function CollapsedItem({href, label, Icon, accent, active, subs = [], pathname, baseHref}) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const timer = useRef(null);
    const enter = () => { clearTimeout(timer.current); setOpen(true); };
    const leave = () => { timer.current = setTimeout(() => setOpen(false), 120); };
    useEffect(() => () => clearTimeout(timer.current), []);

    const iconLink = (
        <Box component={Link} href={href} aria-label={label} aria-current={active ? 'page' : undefined} sx={{
            position: 'relative', width: 48, height: 44, mx: 'auto', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
            color: active ? accent : C.inkMuted, backgroundColor: active ? `${accent}14` : 'transparent',
            transition: 'background-color .15s ease, color .15s ease',
            '&:hover': {backgroundColor: active ? `${accent}1F` : C.surfaceDeep, color: accent},
        }}>
            {active && <Box sx={{position: 'absolute', left: -8, top: 9, bottom: 9, width: 3, borderRadius: 3, backgroundColor: accent}}/>}
            <Icon sx={{fontSize: 23}}/>
        </Box>
    );

    if (subs.length === 0) {
        return <Box sx={{mb: 0.5}}><Tooltip title={label} placement="right" arrow>{iconLink}</Tooltip></Box>;
    }
    return (
        <Box ref={anchorRef} onMouseEnter={enter} onMouseLeave={leave} sx={{mb: 0.5}}>
            {iconLink}
            <Popper open={open} anchorEl={anchorRef.current} placement="right-start" transition sx={{zIndex: 1300}}>
                {({TransitionProps}) => (
                    <Fade {...TransitionProps} timeout={160}>
                        <Box onMouseEnter={enter} onMouseLeave={leave} sx={{
                            ml: '10px', minWidth: 260, p: 1, backgroundColor: '#fff', borderRadius: '12px',
                            border: `1px solid ${C.line}`, borderLeft: `3px solid ${accent}`, boxShadow: '0 24px 50px rgba(6,18,38,0.16)',
                        }}>
                            <Box component={Link} href={href} onClick={() => setOpen(false)} sx={{
                                display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, pt: 1, pb: 1.25, textDecoration: 'none',
                            }}>
                                <Icon sx={{fontSize: 20, color: accent}}/>
                                <Typography sx={{fontFamily: SERIF_STACK, fontSize: 15, fontWeight: 600, color: C.ink}}>{label}</Typography>
                            </Box>
                            {subs.map((s) => {
                                const subActive = isPathActive(pathname, `${baseHref}/${s.url_endpoint}`);
                                return (
                                    <Box key={s.id} component={Link} href={`${baseHref}/${s.url_endpoint}`} onClick={() => setOpen(false)} sx={{
                                        display: 'block', px: 1.5, py: 1, borderRadius: '8px', textDecoration: 'none',
                                        fontSize: 14, fontWeight: subActive ? 650 : 550, color: subActive ? accent : C.ink,
                                        backgroundColor: subActive ? `${accent}12` : 'transparent',
                                        '&:hover': {backgroundColor: `${accent}0F`, color: accent},
                                    }}>
                                        {s.title}
                                    </Box>
                                );
                            })}
                        </Box>
                    </Fade>
                )}
            </Popper>
        </Box>
    );
}

function Sidebar({modules, loading, pathname, collapsed, onToggleCollapsed, top}) {
    const currentKey = moduleKeyFromPath(pathname);
    const [openKey, setOpenKey] = useState(currentKey);
    // Başqa modula keçəndə həmin modul avtomatik açılır
    useEffect(() => { setOpenKey(currentKey); }, [currentKey]);

    return (
        <Box component="nav" aria-label="Əsas menyu" sx={{
            position: 'sticky', top, alignSelf: 'flex-start', flexShrink: 0, zIndex: 1100,
            width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W, height: `calc(100vh - ${top}px)`,
            display: 'flex', flexDirection: 'column', backgroundColor: '#fff', borderRight: `1px solid ${C.line}`,
            boxShadow: '1px 0 0 rgba(6,18,38,0.02), 6px 0 24px rgba(6,18,38,0.04)',
            transition: 'width .25s cubic-bezier(.2,.7,.2,1), top .3s ease, height .3s ease',
            [reducedMotion]: {transition: 'none'},
        }}>
            <Box sx={{flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', p: collapsed ? 1 : 1.5, pt: 2, ...scrollbarSx}}>
                {!collapsed && (
                    <Typography sx={{px: 1.75, pb: 1, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkFaint}}>
                        Modullar
                    </Typography>
                )}
                {collapsed
                    ? <CollapsedItem href="/" label="Ana səhifə" Icon={HomeOutlinedIcon} accent={BRAND.navy600} active={pathname === '/'} pathname={pathname} baseHref=""/>
                    : <ExpandedItem href="/" label="Ana səhifə" Icon={HomeOutlinedIcon} accent={BRAND.navy600} active={pathname === '/'} pathname={pathname} baseHref=""/>}

                {loading && [0, 1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" height={collapsed ? 44 : 40} width={collapsed ? 48 : undefined}
                              sx={{my: 0.75, mx: collapsed ? 'auto' : 0, borderRadius: '10px'}}/>
                ))}

                {modules.map((m) => {
                    const subs = m.sub_modules || [];
                    const baseHref = `/${m.url_endpoint}`;
                    const common = {
                        href: baseHref, label: m.title, Icon: moduleIcon(m.url_endpoint), accent: moduleAccent(m.url_endpoint),
                        active: currentKey === m.url_endpoint, subs, pathname, baseHref,
                    };
                    return collapsed
                        ? <CollapsedItem key={m.id} {...common}/>
                        : <ExpandedItem key={m.id} {...common} open={openKey === m.url_endpoint}
                                        onToggle={() => setOpenKey(openKey === m.url_endpoint ? null : m.url_endpoint)}/>;
                })}
            </Box>

            <Box sx={{borderTop: `1px solid ${C.line}`, p: 1, display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end'}}>
                <Tooltip title={collapsed ? 'Menyunu aç' : 'Menyunu yığ'} placement="right" arrow>
                    <IconButton onClick={onToggleCollapsed} aria-label={collapsed ? 'Menyunu aç' : 'Menyunu yığ'} aria-pressed={collapsed}
                                sx={{color: C.inkMuted, '&:hover': {color: BRAND.navy900}}}>
                        {collapsed ? <KeyboardDoubleArrowRightIcon/> : <KeyboardDoubleArrowLeftIcon/>}
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  Mobil menyu                                                        */
/* ------------------------------------------------------------------ */

function MobileMenu({open, onClose, modules, currentKey}) {
    const [expanded, setExpanded] = useState(currentKey);
    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{sx: {width: 320, maxWidth: '88vw'}}}>
            <Box sx={{height: 4, background: TRICOLOR}}/>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: `1px solid ${C.line}`}}>
                <Typography sx={{fontFamily: SERIF_STACK, fontSize: 18, fontWeight: 600, color: C.ink}}>Menyu</Typography>
                <IconButton onClick={onClose}><CloseIcon/></IconButton>
            </Box>
            <Box sx={{p: 1.5}}>
                <Box component={Link} href="/" onClick={onClose} sx={{display: 'block', px: 1.5, py: 1.25, borderRadius: '10px', textDecoration: 'none',
                    fontWeight: 650, color: C.ink, '&:hover': {backgroundColor: C.surfaceDeep}}}>
                    Ana səhifə
                </Box>
                {modules.map((m) => {
                    const subs = m.sub_modules || [];
                    const isOpen = expanded === m.url_endpoint;
                    const Icon = moduleIcon(m.url_endpoint);
                    return (
                        <Box key={m.id}>
                            <Box sx={{display: 'flex', alignItems: 'center', borderRadius: '10px', '&:hover': {backgroundColor: C.surfaceDeep}}}>
                                <Box component={Link} href={`/${m.url_endpoint}`} onClick={onClose} sx={{
                                    flex: 1, display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1.25, textDecoration: 'none',
                                    color: currentKey === m.url_endpoint ? moduleAccent(m.url_endpoint) : C.ink, fontWeight: 600,
                                }}>
                                    <Icon sx={{fontSize: 20}}/>{m.title}
                                </Box>
                                {subs.length > 0 && (
                                    <IconButton size="small" onClick={() => setExpanded(isOpen ? null : m.url_endpoint)}>
                                        <KeyboardArrowDownIcon sx={{transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease'}}/>
                                    </IconButton>
                                )}
                            </Box>
                            <Collapse in={isOpen}>
                                <Box sx={{ml: 4.5, mb: 1, borderLeft: `2px solid ${C.line}`}}>
                                    {subs.map((s) => (
                                        <Box key={s.id} component={Link} href={`/${m.url_endpoint}/${s.url_endpoint}`} onClick={onClose} sx={{
                                            display: 'block', px: 1.75, py: 0.9, textDecoration: 'none', fontSize: 14, color: C.inkMuted,
                                            '&:hover': {color: C.ink},
                                        }}>
                                            {s.title}
                                        </Box>
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
            </Box>
        </Drawer>
    );
}

/* ------------------------------------------------------------------ */
/*  Başlıq                                                             */
/* ------------------------------------------------------------------ */

function SiteHeader({scrolled, isMobile}) {
    const pathname = usePathname() || '/';
    const {modules} = useUserModules();
    const currentKey = moduleKeyFromPath(pathname);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [today, setToday] = useState('');

    useEffect(() => { setToday(formatNumericDate(new Date())); }, []);
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    return (
        <Box component="header" sx={{position: 'sticky', top: 0, zIndex: 1200}}>
            {/* Gerbli əsas zolaq */}
            <Box sx={{
                position: 'relative', overflow: 'hidden',
                background: `linear-gradient(100deg, ${BRAND.navy950} 0%, ${BRAND.navy900} 45%, ${BRAND.navy700} 100%)`,
            }}>
                <AnimatedPattern opacity={0.05} size={120} duration={60}/>
                <Box sx={{position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 2,
                    height: scrolled ? 60 : 76, transition: 'height .3s ease',
                    px: {xs: 2, sm: 3, md: 5},
                }}>
                    <Box component={Link} href="/" sx={{display: 'flex', alignItems: 'center', gap: 2, textDecoration: 'none', minWidth: 0}}>
                        <Box sx={{position: 'relative', height: scrolled ? 36 : 44, width: scrolled ? 197 : 240, transition: 'all .3s ease', flexShrink: 0}}>
                            <Image src={logo} alt="Müdafiə Sənayesi Nazirliyi" fill priority style={{objectFit: 'contain', objectPosition: 'left center'}}/>
                        </Box>
                        <Box sx={{display: {xs: 'none', lg: 'block'}, pl: 2, borderLeft: '1px solid rgba(255,255,255,0.18)'}}>
                            <Typography sx={{fontFamily: SERIF_STACK, fontSize: 15.5, fontWeight: 600, color: '#fff', lineHeight: 1.2, letterSpacing: '0.01em'}}>
                                Mərkəzləşdirilmiş İnformasiya Sistemi
                            </Typography>
                            <Typography sx={{fontSize: 11.5, color: '#A9B6CC', mt: 0.25, height: scrolled ? 0 : 16, overflow: 'hidden', transition: 'height .3s ease'}}>
                                {today}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{flex: 1}}/>
                    <Box sx={{'& .MuiIconButton-root': {color: '#E7EAF3'}}}>
                        <NotificationBell tone="dark"/>
                    </Box>
                    <UserMenu compact={isMobile}/>
                    {isMobile && (
                        <IconButton onClick={() => setMobileOpen(true)} aria-label="Menyunu aç" sx={{color: '#fff', ml: 0.5}}>
                            <MenuIcon/>
                        </IconButton>
                    )}
                </Box>
                <Box sx={{height: 3, background: TRICOLOR}}/>
            </Box>

            <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} modules={modules} currentKey={currentKey}/>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  Altlıq                                                             */
/* ------------------------------------------------------------------ */

function SiteFooter() {
    return (
        <Box component="footer" sx={{mt: 'auto', backgroundColor: BRAND.navy950, color: '#A9B6CC'}}>
            <Box sx={{height: 3, background: TRICOLOR}}/>
            <Box sx={{
                display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                px: {xs: 2.5, sm: 3, md: 5}, py: 2.5, maxWidth: 1480, mx: 'auto',
            }}>
                <Typography sx={{fontSize: 12.5}}>
                    © {new Date().getFullYear()} Azərbaycan Respublikasının Müdafiə Sənayesi Nazirliyi
                </Typography>
                <Typography sx={{fontSize: 12.5}}>
                    Texniki dəstək: <Box component="a" href="mailto:support@mdi.gov.az" sx={{color: '#E9C766', textDecoration: 'none'}}>support@mdi.gov.az</Box>
                </Typography>
            </Box>
        </Box>
    );
}

/* ------------------------------------------------------------------ */
/*  Karkas                                                             */
/* ------------------------------------------------------------------ */

export default function AppShell({children}) {
    const pathname = usePathname() || '/';
    const {modules, loading} = useUserModules();
    const isMobile = useMediaQuery(MOBILE_QUERY, {noSsr: true});
    const [scrolled, setScrolled] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, {passive: true});
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // İstifadəçinin seçimi (yığılıb/açıq) yadda saxlanılır
    useEffect(() => {
        try { setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'); } catch { /* saxlama əlçatan deyil */ }
    }, []);
    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try { window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0'); } catch { /* saxlama əlçatan deyil */ }
            return next;
        });
    };

    // Ana səhifədə modullar kart kimi göstərildiyi üçün sidebar yalnız digər səhifələrdədir
    const showSidebar = !isMobile && pathname !== '/';

    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                backgroundColor: '#F3F6FA', fontFamily: FONT_STACK,
            }}>
                <SiteHeader scrolled={scrolled} isMobile={isMobile}/>
                <Box sx={{display: 'flex', flex: 1, minWidth: 0}}>
                    {showSidebar && (
                        <Sidebar modules={modules} loading={loading} pathname={pathname} collapsed={collapsed}
                                 onToggleCollapsed={toggleCollapsed} top={headerHeight(scrolled)}/>
                    )}
                    {/* Səhifə dəyişəndə yumşaq görünmə */}
                    <Box component="main" key={pathname} sx={{
                        flex: 1, minWidth: 0,
                        animation: `${fadeIn} .45s ease both`,
                        [reducedMotion]: {animation: 'none'},
                    }}>
                        {children}
                    </Box>
                </Box>
                <SiteFooter/>
            </Box>
        </ThemeProvider>
    );
}
