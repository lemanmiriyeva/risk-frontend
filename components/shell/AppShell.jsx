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
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import {useAppSelector} from "@/lib/hooks";
import {APP_ROUTES} from "@/components/constants";
import NotificationBell from "@/components/atoms/NotificationBell";
import appTheme from "@/components/theme/appTheme";
import {BRAND, C, FONT_STACK, SERIF_STACK, TRICOLOR, formatNumericDate} from "@/components/theme/tokens";
import {fadeIn, reducedMotion} from "@/components/theme/motion";
import {moduleAccent, moduleIcon, moduleKeyFromPath, useUserModules} from "./moduleMeta";
import AnimatedPattern from "./AnimatedPattern";
import logo from '@/app/logo.png';

const NAV_HEIGHT = 52;


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
/*  Üfüqi menyu (modullar + açılan alt bölmələr)                       */
/* ------------------------------------------------------------------ */

function NavLink({href, label, active, hasMenu, open, onEnter, onLeave, anchorRef}) {
    return (
        <Box ref={anchorRef} onMouseEnter={onEnter} onMouseLeave={onLeave} sx={{position: 'relative', height: '100%', display: 'flex'}}>
            <Box component={Link} href={href} sx={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.75, height: '100%', textDecoration: 'none', whiteSpace: 'nowrap',
                fontSize: 14, fontWeight: active ? 650 : 550,
                color: active ? BRAND.navy900 : C.inkMuted,
                transition: 'color .2s ease',
                '&:hover': {color: BRAND.navy900},
                '&::after': {
                    content: '""', position: 'absolute', left: 14, right: 14, bottom: 0, height: 3, borderRadius: '3px 3px 0 0',
                    backgroundColor: BRAND.crest,
                    transform: active || open ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left',
                    transition: 'transform .3s cubic-bezier(.2,.7,.2,1)',
                },
                '&:hover::after': {transform: 'scaleX(1)'},
            }}>
                {label}
                {hasMenu && <KeyboardArrowDownIcon sx={{fontSize: 17, opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease'}}/>}
            </Box>
        </Box>
    );
}

function ModuleNavItem({module, active}) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const timer = useRef(null);
    const subs = module.sub_modules || [];
    const accent = moduleAccent(module.url_endpoint);
    const Icon = moduleIcon(module.url_endpoint);

    const enter = () => { clearTimeout(timer.current); if (subs.length) setOpen(true); };
    const leave = () => { timer.current = setTimeout(() => setOpen(false), 120); };

    return (
        <>
            <NavLink href={`/${module.url_endpoint}`} label={module.title} active={active} hasMenu={subs.length > 0}
                     open={open} onEnter={enter} onLeave={leave} anchorRef={anchorRef}/>
            {subs.length > 0 && (
                <Popper open={open} anchorEl={anchorRef.current} placement="bottom-start" transition sx={{zIndex: 1300}}>
                    {({TransitionProps}) => (
                        <Fade {...TransitionProps} timeout={180}>
                            <Box onMouseEnter={enter} onMouseLeave={leave} sx={{
                                mt: '1px', minWidth: 300, p: 1, backgroundColor: '#fff', borderRadius: '0 0 14px 14px',
                                border: `1px solid ${C.line}`, borderTop: `3px solid ${accent}`,
                                boxShadow: '0 24px 50px rgba(6,18,38,0.16)',
                            }}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, pt: 1, pb: 1.25}}>
                                    <Icon sx={{fontSize: 20, color: accent}}/>
                                    <Typography sx={{fontFamily: SERIF_STACK, fontSize: 15, fontWeight: 600, color: C.ink}}>{module.title}</Typography>
                                </Box>
                                {subs.map((s) => (
                                    <Box key={s.id} component={Link} href={`/${module.url_endpoint}/${s.url_endpoint}`}
                                         onClick={() => setOpen(false)} sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                                        px: 1.5, py: 1.1, borderRadius: '10px', textDecoration: 'none',
                                        color: C.ink, fontSize: 14, fontWeight: 550,
                                        transition: 'background-color .15s ease, padding-left .2s ease',
                                        '&:hover': {backgroundColor: `${accent}0F`, color: accent, pl: 2},
                                    }}>
                                        {s.title}
                                        <NorthEastIcon sx={{fontSize: 15, opacity: 0.55}}/>
                                    </Box>
                                ))}
                            </Box>
                        </Fade>
                    )}
                </Popper>
            )}
        </>
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

function SiteHeader() {
    const pathname = usePathname() || '/';
    const {modules, loading} = useUserModules();
    const currentKey = moduleKeyFromPath(pathname);
    const isMobile = useMediaQuery('(max-width:1099px)', {noSsr: true});
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [today, setToday] = useState('');

    useEffect(() => { setToday(formatNumericDate(new Date())); }, []);
    useEffect(() => { setMobileOpen(false); }, [pathname]);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, {passive: true});
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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
                    px: {xs: 2, sm: 3, md: 5}, maxWidth: 1480, mx: 'auto',
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

            {/* Naviqasiya zolağı */}
            {!isMobile && (
                <Box sx={{
                    backgroundColor: 'rgba(255,255,255,0.94)', backdropFilter: 'saturate(180%) blur(10px)',
                    borderBottom: `1px solid ${C.line}`,
                    boxShadow: scrolled ? '0 10px 30px rgba(6,18,38,0.08)' : 'none', transition: 'box-shadow .3s ease',
                }}>
                    <Box sx={{display: 'flex', alignItems: 'stretch', height: NAV_HEIGHT, px: {sm: 1.5, md: 3.5}, maxWidth: 1480, mx: 'auto',
                        overflowX: 'auto', '&::-webkit-scrollbar': {display: 'none'}}}>
                        <NavLink href="/" label="Ana səhifə" active={pathname === '/'}/>
                        {loading && [0, 1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} width={96} sx={{mx: 1.5, alignSelf: 'center'}}/>
                        ))}
                        {modules.map((m) => (
                            <ModuleNavItem key={m.id} module={m} active={currentKey === m.url_endpoint}/>
                        ))}
                    </Box>
                </Box>
            )}

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
    const pathname = usePathname();
    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                backgroundColor: '#F3F6FA', fontFamily: FONT_STACK,
            }}>
                <SiteHeader/>
                {/* Səhifə dəyişəndə yumşaq görünmə */}
                <Box component="main" key={pathname} sx={{
                    flex: 1, minWidth: 0,
                    animation: `${fadeIn} .45s ease both`,
                    [reducedMotion]: {animation: 'none'},
                }}>
                    {children}
                </Box>
                <SiteFooter/>
            </Box>
        </ThemeProvider>
    );
}
