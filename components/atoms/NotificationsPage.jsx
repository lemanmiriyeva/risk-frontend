"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {useSnackbar} from "notistack";
import {useRouter} from 'next/navigation';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

const C = {
    surface: '#FFFFFF',
    surfaceRaised: '#FBFAF6',
    line: '#E4E1D8',
    lineStrong: '#D0CCC0',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    gold: '#9C7A2E',
    unreadBg: 'rgba(156,122,46,0.06)',
};

const PERIOD_FILTERS = [
    {value: '', label: 'Hamısı'},
    {value: 'today', label: 'Bu gün'},
    {value: 'week', label: 'Bu həftə'},
    {value: 'month', label: 'Bu ay'},
];

const READ_FILTERS = [
    {value: '', label: 'Hamısı'},
    {value: '1', label: 'Oxunmamış'},
];

const PAGE_SIZE = 20;

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('az-AZ', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

export default function NotificationsPage() {
    const {enqueueSnackbar} = useSnackbar();
    const router = useRouter();

    const [period, setPeriod] = useState('');
    const [unreadOnly, setUnreadOnly] = useState('');
    const [page, setPage] = useState(1);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [numPages, setNumPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('page_size', String(PAGE_SIZE));
            if (period) params.set('period', period);
            if (unreadOnly) params.set('unread', unreadOnly);

            const res = await service_api.get(`${NEXT_API_ENDPOINTS.NOTIFICATIONS.LIST}?${params.toString()}`);
            setNotifications(res.data?.results || []);
            setUnreadCount(res.data?.unread_count || 0);
            setNumPages(res.data?.num_pages || 1);
            setTotalCount(res.data?.count || 0);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [page, period, unreadOnly, enqueueSnackbar]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Filtr dəyişəndə səhifəni 1-ə qaytar
    useEffect(() => {
        setPage(1);
    }, [period, unreadOnly]);

    async function handleItemClick(item) {
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

    async function handleMarkAllRead() {
        const previous = notifications;
        setNotifications((prev) => prev.map((n) => ({...n, is_read: true})));
        setUnreadCount(0);
        try {
            await service_api.patch(NEXT_API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
            enqueueSnackbar('Bütün bildirişlər oxundu edildi.', {variant: 'success'});
        } catch (e) {
            setNotifications(previous);
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    }

    const emptyMessage = useMemo(() => {
        if (unreadOnly) return 'Oxunmamış bildiriş yoxdur.';
        if (period === 'today') return 'Bu gün üçün bildiriş yoxdur.';
        if (period === 'week') return 'Bu həftə üçün bildiriş yoxdur.';
        if (period === 'month') return 'Bu ay üçün bildiriş yoxdur.';
        return 'Hələ bildirişiniz yoxdur.';
    }, [unreadOnly, period]);

    return (
        <Box sx={{maxWidth: 1440, mx: 'auto', mt: 4, px: 2, pb: 6}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2}}>
                <Typography sx={{fontSize: 14, color: C.inkMuted}}>
                    {totalCount > 0 ? `Cəmi ${totalCount} bildiriş${unreadCount ? `, ${unreadCount} oxunmamış` : ''}.` : ' '}
                </Typography>
                {unreadCount > 0 && (
                    <Button
                        startIcon={<DoneAllIcon/>} onClick={handleMarkAllRead}
                        sx={{color: C.gold, textTransform: 'none', fontWeight: 600}}
                    >
                        Hamısını oxundu et
                    </Button>
                )}
            </Box>

            <Box sx={{display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center'}}>
                <Typography sx={{fontSize: 12.5, color: C.inkFaint, mr: 0.5}}>Dövr:</Typography>
                {PERIOD_FILTERS.map((f) => (
                    <Chip
                        key={f.value} label={f.label} size="small" onClick={() => setPeriod(f.value)}
                        sx={{
                            fontWeight: 500,
                            backgroundColor: period === f.value ? C.ink : C.surfaceRaised,
                            color: period === f.value ? '#fff' : C.inkMuted,
                            border: `1px solid ${period === f.value ? C.ink : C.line}`,
                            '&:hover': {backgroundColor: period === f.value ? C.ink : 'rgba(0,0,0,0.04)'},
                        }}
                    />
                ))}
            </Box>

            <Box sx={{display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center'}}>
                <Typography sx={{fontSize: 12.5, color: C.inkFaint, mr: 0.5}}>Status:</Typography>
                {READ_FILTERS.map((f) => (
                    <Chip
                        key={f.value} label={f.label} size="small" onClick={() => setUnreadOnly(f.value)}
                        sx={{
                            fontWeight: 500,
                            backgroundColor: unreadOnly === f.value ? C.ink : C.surfaceRaised,
                            color: unreadOnly === f.value ? '#fff' : C.inkMuted,
                            border: `1px solid ${unreadOnly === f.value ? C.ink : C.line}`,
                            '&:hover': {backgroundColor: unreadOnly === f.value ? C.ink : 'rgba(0,0,0,0.04)'},
                        }}
                    />
                ))}
            </Box>

            <Box sx={{border: `1px solid ${C.line}`, borderRadius: '10px', backgroundColor: C.surface, overflow: 'hidden'}}>
                {loading && (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                        <CircularProgress size={26} sx={{color: C.gold}}/>
                    </Box>
                )}

                {!loading && notifications.length === 0 && (
                    <Box sx={{py: 6, textAlign: 'center'}}>
                        <Typography sx={{fontSize: 14, color: C.inkFaint}}>{emptyMessage}</Typography>
                    </Box>
                )}

                {!loading && notifications.map((item, idx) => (
                    <React.Fragment key={item.id}>
                        {idx > 0 && <Divider sx={{borderColor: C.line}}/>}
                        <Box
                            onClick={() => handleItemClick(item)}
                            sx={{
                                display: 'flex', gap: 1.5, px: 2.5, py: 2, cursor: 'pointer',
                                backgroundColor: item.is_read ? 'transparent' : C.unreadBg,
                                borderLeft: item.is_read ? '3px solid transparent' : `3px solid ${C.gold}`,
                                transition: 'background-color .15s ease',
                                '&:hover': {backgroundColor: 'rgba(0,0,0,0.02)'},
                            }}
                        >
                            <Box sx={{flex: 1, minWidth: 0}}>
                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1}}>
                                    <Typography sx={{fontSize: 14.5, fontWeight: item.is_read ? 500 : 700, color: C.ink}}>
                                        {item.title}
                                    </Typography>
                                    <Typography sx={{fontSize: 12, color: C.inkFaint, whiteSpace: 'nowrap', flexShrink: 0}}>
                                        {formatDateTime(item.created_at)}
                                    </Typography>
                                </Box>
                                {item.body && (
                                    <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.5}}>
                                        {item.body}
                                    </Typography>
                                )}
                                {item.notification_type_display && (
                                    <Chip
                                        label={item.notification_type_display} size="small"
                                        sx={{mt: 1, height: 20, fontSize: 11, backgroundColor: C.surfaceRaised, color: C.inkFaint}}
                                    />
                                )}
                            </Box>
                        </Box>
                    </React.Fragment>
                ))}
            </Box>

            {!loading && numPages > 1 && (
                <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
                    <Pagination
                        count={numPages} page={page} onChange={(e, value) => setPage(value)}
                        shape="rounded" color="standard"
                        sx={{'& .Mui-selected': {backgroundColor: `${C.ink} !important`, color: '#fff'}}}
                    />
                </Box>
            )}
        </Box>
    );
}