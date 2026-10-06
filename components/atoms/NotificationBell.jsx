"use client"
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {useRouter} from 'next/navigation';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";

const POLL_INTERVAL_MS = 30000;
const GOLD = '#C9A24B';

/* İki görünüş: köhnə tünd başlıq üçün "dark", yeni ağ üst panel üçün "light". */
const TONES = {
    dark: {
        icon: '#E7EAF3', accent: GOLD, badgeBg: GOLD, badgeText: '#0E1730',
        paper: '#0E1730', paperText: '#E7EAF3', border: 'rgba(255,255,255,0.08)', shadow: '0 20px 45px rgba(2,6,36,0.5)',
        title: '#fff', muted: '#9AA5C7', faint: '#6E7896', unread: 'rgba(201,162,75,0.07)', hover: 'rgba(201,162,75,0.12)',
    },
    light: {
        icon: '#334155', accent: '#0A6CC2', badgeBg: '#C42F3D', badgeText: '#fff',
        paper: '#FFFFFF', paperText: '#0F1B2D', border: '#E3E8F0', shadow: '0 18px 40px rgba(6,18,38,0.14)',
        title: '#0F1B2D', muted: '#55657D', faint: '#8693A7', unread: 'rgba(10,108,194,0.06)', hover: 'rgba(10,108,194,0.10)',
    },
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'indicə';
    if (mins < 60) return `${mins} dəq əvvəl`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat əvvəl`;
    const days = Math.floor(hours / 24);
    return `${days} gün əvvəl`;
}

export default function NotificationBell({tone = 'dark'}) {
    const T = TONES[tone] || TONES.dark;
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const pollRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
            setUnreadCount(res.data?.unread_count || 0);
        } catch (e) {
            // Səssizcə keç - bildiriş sayı kritik funksionallıq deyil
        }
    }, []);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.NOTIFICATIONS.LIST);
            setNotifications(res.data?.results || []);
            setUnreadCount(res.data?.unread_count || 0);
        } catch (e) {
            // Səssizcə keç
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        pollRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
        return () => clearInterval(pollRef.current);
    }, [fetchUnreadCount]);

    function handleOpen(e) {
        setAnchorEl(e.currentTarget);
        fetchList();
    }

    function handleClose() {
        setAnchorEl(null);
    }

    async function handleItemClick(item) {
        handleClose();
        if (!item.is_read) {
            setNotifications((prev) => prev.map((n) => (n.id === item.id ? {...n, is_read: true} : n)));
            setUnreadCount((c) => Math.max(0, c - 1));
            try {
                await service_api.patch(`${NEXT_API_ENDPOINTS.NOTIFICATIONS.MARK_READ}${item.id}/read/`);
            } catch (e) {
                // sakitcə keç
            }
        }
        if (item.link) router.push(item.link);
    }

    async function handleMarkAllRead(e) {
        e.stopPropagation();
        const previous = notifications;
        setNotifications((prev) => prev.map((n) => ({...n, is_read: true})));
        setUnreadCount(0);
        try {
            await service_api.patch(NEXT_API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
        } catch (e) {
            setNotifications(previous);
        }
    }

    return (
        <>
            <Tooltip title="Bildirişlər">
                <IconButton onClick={handleOpen} sx={{color: T.icon}}>
                    <Badge
                        badgeContent={unreadCount} max={99}
                        sx={{'& .MuiBadge-badge': {backgroundColor: T.badgeBg, color: T.badgeText, fontWeight: 700}}}
                    >
                        <NotificationsNoneOutlinedIcon/>
                    </Badge>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1, width: 360, maxWidth: '92vw', maxHeight: 460, borderRadius: 2.5,
                            backgroundColor: T.paper, color: T.paperText,
                            border: `1px solid ${T.border}`,
                            boxShadow: T.shadow,
                        }
                    }
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5}}>
                    <Typography sx={{fontSize: 14, fontWeight: 700, color: T.title}}>
                        Bildirişlər
                    </Typography>
                    {unreadCount > 0 && (
                        <Tooltip title="Hamısını oxundu et">
                            <IconButton size="small" onClick={handleMarkAllRead} sx={{color: T.accent}}>
                                <DoneAllIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                <Divider sx={{borderColor: T.border}}/>

                {loading && (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 3}}>
                        <CircularProgress size={22} sx={{color: T.accent}}/>
                    </Box>
                )}

                {!loading && notifications.length === 0 && (
                    <Box sx={{px: 2, py: 3, textAlign: 'center'}}>
                        <Typography sx={{fontSize: 13, color: T.muted}}>
                            Hələ bildirişiniz yoxdur.
                        </Typography>
                    </Box>
                )}

                {!loading && notifications.map((item) => (
                    <MenuItem
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        sx={{
                            alignItems: 'flex-start', gap: 1, py: 1.2, px: 2, whiteSpace: 'normal',
                            backgroundColor: item.is_read ? 'transparent' : T.unread,
                            borderLeft: item.is_read ? '2px solid transparent' : `2px solid ${T.accent}`,
                            '&:hover': {backgroundColor: T.hover},
                        }}
                    >
                        <Box sx={{flex: 1, minWidth: 0}}>
                            <Typography sx={{fontSize: 13.5, fontWeight: item.is_read ? 500 : 700, color: T.title}}>
                                {item.title}
                            </Typography>
                            {item.body && (
                                <Typography sx={{fontSize: 12.5, color: T.muted, mt: 0.25, whiteSpace: 'normal'}}>
                                    {item.body}
                                </Typography>
                            )}
                            <Typography sx={{fontSize: 11, color: T.faint, mt: 0.5}}>
                                {timeAgo(item.created_at)}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}

                <Divider sx={{borderColor: T.border}}/>
                <Box sx={{textAlign: 'center', py: 1}}>
                    <Button
                        size="small"
                        onClick={() => {
                            handleClose();
                            router.push(APP_ROUTES.NOTIFICATIONS);
                        }}
                        sx={{color: T.accent, textTransform: 'none', fontWeight: 600, fontSize: 13}}
                    >
                        Bütün bildirişlərə bax
                    </Button>
                </Box>
            </Menu>
        </>
    );
}