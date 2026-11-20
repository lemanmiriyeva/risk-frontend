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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {useAppSelector} from "@/lib/hooks";
import {APP_ROUTES} from "@/components/constants";
import NotificationBell from "@/components/atoms/NotificationBell";
import appTheme from "@/components/theme/appTheme";
import {BRAND, C, FONT_STACK, SERIF_STACK, TRICOLOR, formatNumericDate} from "@/components/theme/tokens";
import {fadeIn, reducedMotion} from "@/components/theme/motion";
import {moduleAccent, moduleIcon, moduleKeyFromPath, useUserModules} from "./moduleMeta";
import AnimatedPattern from "./AnimatedPattern";
import logo from '@/app/logo.png';

const SIDEBAR_W = 280;
const SIDEBAR_W_COLLAPSED = 92;
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

/* Rəngi ağa doğru açır (tünd fonda tünd vurğu rəngləri də oxunsun deyə). */
function lift(hex, amount = 0.3) {
    const n = parseInt(String(hex).replace('#', ''), 16);
    if (Number.isNaN(n)) return hex;
    const f = (c) => Math.round(c + (255 - c) * amount);
    return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('')}`;
}

const NAVY_TEXT = '#C9D4E6';
const NAVY_MUTED = '#7C8EAD';

const scrollbarSx = {
    '&::-webkit-scrollbar': {width: 5},
    '&::-webkit-scrollbar-thumb': {backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 3},
};

/** Rəngli ikon "plitəsi" - aktiv olanda vurğu rəngi ilə parlayır. */
function IconTile({Icon, accent, active, size = 36}) {
    return (
        <Box className="nav-tile" sx={{
            width: size, height: size, flexShrink: 0, borderRadius: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: active ? '#fff' : NAVY_TEXT,
            background: active ? `linear-gradient(135deg, ${lift(accent, 0.28)}, ${accent})` : 'rgba(255,255,255,0.06)',
            boxShadow: active ? `0 6px 18px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.25)` : 'none',
            transition: 'background .2s ease, box-shadow .2s ease, color .2s ease, transform .2s ease',
        }}>
            <Icon sx={{fontSize: 20}}/>
        </Box>
    );
}

/** Açıq sidebar: plitə + ad, alt bölmələr akkordeon kimi açılır. */
function ExpandedItem({href, label, Icon, accent, active, subs = [], pathname, open, onToggle, baseHref}) {
    return (
        <Box sx={{mb: 0.5}}>
            <Box sx={{
                position: 'relative', display: 'flex', alignItems: 'center', borderRadius: '14px',
                background: active ? `linear-gradient(90deg, ${accent}38 0%, ${accent}0D 70%, transparent 100%)` : 'transparent',
                transition: 'background .2s ease',
                '&:hover': {backgroundColor: active ? undefined : 'rgba(255,255,255,0.05)'},
                '&:hover .nav-tile': {transform: 'scale(1.06)', ...(active ? {} : {backgroundColor: `${accent}40`, color: '#fff'})},
            }}>
                {active && (
                    <Box sx={{position: 'absolute', left: -12, top: 10, bottom: 10, width: 4, borderRadius: '0 4px 4px 0',
                        backgroundColor: lift(accent, 0.15), boxShadow: `0 0 12px ${accent}`}}/>
                )}
                <Box component={Link} href={href} aria-current={active ? 'page' : undefined} sx={{
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5, p: '7px 8px',
                    textDecoration: 'none', fontSize: 14, fontWeight: active ? 700 : 550, color: active ? '#fff' : NAVY_TEXT,
                    '&:hover': {color: '#fff'},
                }}>
                    <IconTile Icon={Icon} accent={accent} active={active}/>
                    <Box component="span" sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{label}</Box>
                </Box>
                {subs.length > 0 && (
                    <IconButton size="small" onClick={onToggle} aria-expanded={open} aria-label={`${label} alt bölmələri`}
                                sx={{mr: 0.5, color: NAVY_MUTED, '&:hover': {color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)'}}}>
                        <KeyboardArrowDownIcon fontSize="small" sx={{transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease'}}/>
                    </IconButton>
                )}
            </Box>
            {subs.length > 0 && (
                <Collapse in={open} timeout={220} unmountOnExit>
                    <Box sx={{ml: '25px', pl: 2, my: 0.5, position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.12)'}}>
                        {subs.map((sub) => {
                            const subHref = `${baseHref}/${sub.url_endpoint}`;
                            const subActive = isPathActive(pathname, subHref);
                            return (
                                <Box key={sub.id} component={Link} href={subHref} aria-current={subActive ? 'page' : undefined} sx={{
                                    position: 'relative', display: 'flex', alignItems: 'center', px: 1.5, py: 0.85, my: '2px', borderRadius: '10px',
                                    textDecoration: 'none', fontSize: 13.5, fontWeight: subActive ? 650 : 500,
                                    color: subActive ? '#fff' : NAVY_MUTED, backgroundColor: subActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    transition: 'background-color .15s ease, color .15s ease',
                                    '&:hover': {color: '#fff', backgroundColor: 'rgba(255,255,255,0.06)'},
                                    '&::before': {
                                        content: '""', position: 'absolute', left: -21, top: '50%', width: 9, height: 9, borderRadius: '50%',
                                        transform: 'translateY(-50%)', backgroundColor: subActive ? lift(accent, 0.15) : BRAND.navy700,
                                        border: `2px solid ${BRAND.navy900}`, boxShadow: subActive ? `0 0 10px ${accent}` : 'none',
                                    },
                                }}>
                                    {sub.title}
                                </Box>
                            );
                        })}
                    </Box>
                </Collapse>
            )}
        </Box>
    );
}

/** Yığılmış sidebar: yalnız plitələr; alt bölməsi olan modulun üzərinə gələndə sağda açılan siyahı. */
function CollapsedItem({href, label, Icon, accent, active, subs = [], pathname, baseHref}) {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);
    const timer = useRef(null);
    const enter = () => { clearTimeout(timer.current); setOpen(true); };
    const leave = () => { timer.current = setTimeout(() => setOpen(false), 120); };
    useEffect(() => () => clearTimeout(timer.current), []);

    const tile = (
        <Box component={Link} href={href} aria-label={label} aria-current={active ? 'page' : undefined} sx={{
            position: 'relative', display: 'flex', justifyContent: 'center', py: 0.5, textDecoration: 'none',
            '&:hover .nav-tile': {transform: 'scale(1.08)', ...(active ? {} : {backgroundColor: `${accent}40`, color: '#fff'})},
        }}>
            {active && (
                <Box sx={{position: 'absolute', left: -12, top: 12, bottom: 12, width: 4, borderRadius: '0 4px 4px 0',
                    backgroundColor: lift(accent, 0.15), boxShadow: `0 0 12px ${accent}`}}/>
            )}
            <IconTile Icon={Icon} accent={accent} active={active} size={44}/>
        </Box>
    );

    if (subs.length === 0) {
        return <Box sx={{mb: 0.25}}><Tooltip title={label} placement="right" arrow>{tile}</Tooltip></Box>;
    }
    return (
        <Box ref={anchorRef} onMouseEnter={enter} onMouseLeave={leave} sx={{mb: 0.25}}>
            {tile}
            <Popper open={open} anchorEl={anchorRef.current} placement="right-start" transition sx={{zIndex: 1300}}>
                {({TransitionProps}) => (
                    <Fade {...TransitionProps} timeout={160}>
                        <Box onMouseEnter={enter} onMouseLeave={leave} sx={{
                            ml: '14px', minWidth: 250, p: 1, borderRadius: '16px',
                            background: `linear-gradient(180deg, ${BRAND.navy900}, ${BRAND.navy950})`,
                            border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 60px rgba(6,18,38,0.45)',
                        }}>
                            <Box component={Link} href={href} onClick={() => setOpen(false)} sx={{
                                display: 'flex', alignItems: 'center', gap: 1.25, px: 1, pt: 0.75, pb: 1.25, textDecoration: 'none',
                            }}>
                                <IconTile Icon={Icon} accent={accent} active size={32}/>
                                <Typography sx={{fontFamily: SERIF_STACK, fontSize: 15, fontWeight: 600, color: '#fff'}}>{label}</Typography>
                            </Box>
                            {subs.map((sub) => {
                                const subActive = isPathActive(pathname, `${baseHref}/${sub.url_endpoint}`);
                                return (
                                    <Box key={sub.id} component={Link} href={`${baseHref}/${sub.url_endpoint}`} onClick={() => setOpen(false)} sx={{
                                        display: 'block', px: 1.5, py: 1, borderRadius: '10px', textDecoration: 'none',
                                        fontSize: 14, fontWeight: subActive ? 650 : 500, color: subActive ? '#fff' : NAVY_TEXT,
                                        backgroundColor: subActive ? 'rgba(255,255,255,0.10)' : 'transparent',
                                        '&:hover': {backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff'},
                                    }}>
                                        {sub.title}
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

/** Aşağıdakı istifadəçi kartı (şəxsi kabinetə keçid). */
function SidebarUser({collapsed}) {
    const user = useAppSelector(({user}) => user);
    const avatar = (
        <Avatar src={user?.image || undefined} sx={{width: 38, height: 38, fontSize: 13, fontWeight: 700, bgcolor: BRAND.crest, color: BRAND.navy950}}>
            {user?.isLoaded === false ? '' : initials(user)}
        </Avatar>
    );
    const card = (
        <Box component={Link} href={APP_ROUTES.PROFILE} aria-label="Şəxsi kabinet" sx={{
            display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 1.25,
            p: collapsed ? 0.75 : 1.1, borderRadius: '14px', textDecoration: 'none',
            backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            transition: 'background-color .2s ease, border-color .2s ease',
            '&:hover': {backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(201,154,30,0.55)'},
        }}>
            {avatar}
            {!collapsed && (
                <Box sx={{minWidth: 0}}>
                    <Typography sx={{fontSize: 13, fontWeight: 650, color: '#fff', lineHeight: 1.25}} noWrap>{fullName(user)}</Typography>
                    <Typography sx={{fontSize: 11.5, color: NAVY_MUTED, lineHeight: 1.3}} noWrap>{roleLabel(user)}</Typography>
                </Box>
            )}
        </Box>
    );
    return collapsed ? <Tooltip title={fullName(user) || 'Şəxsi kabinet'} placement="right" arrow>{card}</Tooltip> : card;
}

function Sidebar({modules, loading, pathname, collapsed, onToggleCollapsed, top}) {
    const currentKey = moduleKeyFromPath(pathname);
    const [openKey, setOpenKey] = useState(currentKey);
    // Başqa modula keçəndə həmin modul avtomatik açılır
    useEffect(() => { setOpenKey(currentKey); }, [currentKey]);

    const home = {href: '/', label: 'Ana səhifə', Icon: HomeOutlinedIcon, accent: BRAND.accent, active: pathname === '/', pathname, baseHref: ''};

    return (
        <Box component="nav" aria-label="Əsas menyu" sx={{
            position: 'sticky', top, alignSelf: 'flex-start', flexShrink: 0, zIndex: 1100,
            width: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W, height: `calc(100vh - ${top}px)`, p: '12px',
            transition: 'width .28s cubic-bezier(.2,.7,.2,1), top .3s ease, height .3s ease',
            [reducedMotion]: {transition: 'none'},
        }}>
            {/* Üzən panel */}
            <Box sx={{
                position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                borderRadius: '22px',
                background: `radial-gradient(120% 60% at 0% 0%, ${BRAND.navy700} 0%, transparent 60%), linear-gradient(180deg, ${BRAND.navy900} 0%, ${BRAND.navy950} 100%)`,
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 18px 44px rgba(6,18,38,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
                <AnimatedPattern opacity={0.045} size={110} duration={90}/>
                <Box sx={{position: 'relative', flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', p: collapsed ? '14px 10px' : '16px 12px', ...scrollbarSx}}>
                    {!collapsed && (
                        <Typography sx={{px: 1.25, pb: 1.25, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: NAVY_MUTED}}>
                            Modullar
                        </Typography>
                    )}
                    {collapsed ? <CollapsedItem {...home}/> : <ExpandedItem {...home}/>}

                    {loading && [0, 1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} variant="rounded" height={collapsed ? 44 : 50} width={collapsed ? 44 : undefined}
                                  sx={{my: 0.75, mx: collapsed ? 'auto' : 0, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.07)'}}/>
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

                <Box sx={{position: 'relative', p: collapsed ? '10px' : '12px', borderTop: '1px solid rgba(255,255,255,0.08)'}}>
                    <SidebarUser collapsed={collapsed}/>
                </Box>
            </Box>

            {/* Panelin kənarında dairəvi yığma düyməsi */}
            <Tooltip title={collapsed ? 'Menyunu aç' : 'Menyunu yığ'} placement="right" arrow>
                <IconButton onClick={onToggleCollapsed} aria-label={collapsed ? 'Menyunu aç' : 'Menyunu yığ'} aria-pressed={collapsed} sx={{
                    position: 'absolute', top: 34, right: -2, width: 28, height: 28, zIndex: 2,
                    backgroundColor: '#fff', color: BRAND.navy800, border: `1px solid ${C.line}`,
                    boxShadow: '0 4px 14px rgba(6,18,38,0.22)',
                    '&:hover': {backgroundColor: BRAND.crestSoft, color: BRAND.navy900},
                }}>
                    {collapsed ? <ChevronRightIcon sx={{fontSize: 18}}/> : <ChevronLeftIcon sx={{fontSize: 18}}/>}
                </IconButton>
            </Tooltip>
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
