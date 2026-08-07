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

export default function NotificationBell() {
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
                <IconButton onClick={handleOpen} sx={{color: '#E7EAF3'}}>
                    <Badge
                        badgeContent={unreadCount} max={99}
                        sx={{'& .MuiBadge-badge': {backgroundColor: GOLD, color: '#0E1730', fontWeight: 700}}}
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
                            backgroundColor: '#0E1730', color: '#E7EAF3',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 20px 45px rgba(2,6,36,0.5)',
                        }
                    }
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5}}>
                    <Typography sx={{fontSize: 14, fontWeight: 700, color: '#fff'}}>
                        Bildirişlər
                    </Typography>
                    {unreadCount > 0 && (
                        <Tooltip title="Hamısını oxundu et">
                            <IconButton size="small" onClick={handleMarkAllRead} sx={{color: GOLD}}>
                                <DoneAllIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                <Divider sx={{borderColor: 'rgba(255,255,255,0.08)'}}/>

                {loading && (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 3}}>
                        <CircularProgress size={22} sx={{color: GOLD}}/>
                    </Box>
                )}

                {!loading && notifications.length === 0 && (
                    <Box sx={{px: 2, py: 3, textAlign: 'center'}}>
                        <Typography sx={{fontSize: 13, color: '#9AA5C7'}}>
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
                            backgroundColor: item.is_read ? 'transparent' : 'rgba(201,162,75,0.07)',
                            borderLeft: item.is_read ? '2px solid transparent' : `2px solid ${GOLD}`,
                            '&:hover': {backgroundColor: 'rgba(201,162,75,0.12)'},
                        }}
                    >
                        <Box sx={{flex: 1, minWidth: 0}}>
                            <Typography sx={{fontSize: 13.5, fontWeight: item.is_read ? 500 : 700, color: '#fff'}}>
                                {item.title}
                            </Typography>
                            {item.body && (
                                <Typography sx={{fontSize: 12.5, color: '#9AA5C7', mt: 0.25, whiteSpace: 'normal'}}>
                                    {item.body}
                                </Typography>
                            )}
                            <Typography sx={{fontSize: 11, color: '#6E7896', mt: 0.5}}>
                                {timeAgo(item.created_at)}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}

                <Divider sx={{borderColor: 'rgba(255,255,255,0.08)'}}/>
                <Box sx={{textAlign: 'center', py: 1}}>
                    <Button
                        size="small"
                        onClick={() => {
                            handleClose();
                            router.push(APP_ROUTES.NOTIFICATIONS);
                        }}
                        sx={{color: GOLD, textTransform: 'none', fontWeight: 600, fontSize: 13}}
                    >
                        Bütün bildirişlərə bax
                    </Button>
                </Box>
            </Menu>
        </>
    );
}