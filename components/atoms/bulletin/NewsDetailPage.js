"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, EmptyState, NewsFormDialog, useCanManageBulletin, dialogPaperSx, formatFull,
    normalizeList, pageWrapSx, panelSx, primaryButtonSx, readingTime, softButtonSx,
} from "./bulletinShared";

export default function NewsDetailPage({id}) {
    const {enqueueSnackbar} = useSnackbar();
    const router = useRouter();
    const {canManage} = useCanManageBulletin();

    const [item, setItem] = useState(null);
    const [others, setOthers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setNotFound(false);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.NEWS_DETAIL(id));
            setItem(res.data);
        } catch (err) {
            // Detal endpoint-i əlçatan deyilsə, siyahıdan tapmağa cəhd edirik.
            try {
                const listRes = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.NEWS);
                const found = normalizeList(listRes.data).find((n) => String(n.id) === String(id));
                if (found) setItem(found);
                else setNotFound(true);
            } catch (e2) {
                setNotFound(true);
                enqueueSnackbar(handleError(err), {variant: 'error'});
            }
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.NEWS);
                setOthers(normalizeList(res.data).filter((n) => String(n.id) !== String(id)).slice(0, 5));
            } catch (e) {
                // yan sütun kritik deyil
            }
        })();
    }, [id]);

    const paragraphs = useMemo(() => {
        const text = item?.body || item?.summary || '';
        return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    }, [item]);

    async function handleDelete() {
        setDeleting(true);
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.BULLETIN.NEWS_DETAIL(id));
            enqueueSnackbar('Xəbər silindi.', {variant: 'success'});
            router.push('/elanlar/xeberler');
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
            setDeleting(false);
            setConfirmOpen(false);
        }
    }

    function copyLink() {
        try {
            navigator.clipboard.writeText(window.location.href);
            enqueueSnackbar('Keçid kopyalandı.', {variant: 'success'});
        } catch (e) {
            enqueueSnackbar('Keçidi kopyalamaq alınmadı.', {variant: 'warning'});
        }
    }

    if (loading) {
        return (
            <Box sx={pageWrapSx}>
                <Skeleton variant="rounded" height={340} sx={{mb: 3}}/>
                <Skeleton variant="text" height={44} width="70%"/>
                <Skeleton variant="text" height={20} width="40%" sx={{mb: 3}}/>
                <Skeleton variant="rounded" height={220}/>
            </Box>
        );
    }

    if (notFound || !item) {
        return (
            <Box sx={pageWrapSx}>
                <Box sx={panelSx}>
                    <EmptyState
                        icon={<NewspaperOutlinedIcon sx={{fontSize: 34}}/>}
                        title="Xəbər tapılmadı"
                        hint="Xəbər silinmiş və ya keçid səhv ola bilər."
                    />
                    <Box sx={{display: 'flex', justifyContent: 'center', pb: 3}}>
                        <Button component={Link} href="/elanlar/xeberler" sx={softButtonSx}>
                            Xəbər arxivinə qayıt
                        </Button>
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={pageWrapSx}>
            <Button component={Link} href="/elanlar/xeberler" startIcon={<ArrowBackIcon sx={{fontSize: 13}}/>}
                    sx={{textTransform: 'none', color: C.inkMuted, mb: 2, fontSize: 13}}>
                Xəbərlər
            </Button>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Box sx={{...panelSx, overflow: 'hidden'}}>
                        {item.image_url && (
                            <Box component="img" src={item.image_url} alt={item.title}
                                 sx={{width: '100%', maxHeight: 420, objectFit: 'cover', display: 'block'}}/>
                        )}
                        <Box sx={{p: {xs: 2.5, md: 4}}}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1.5}}>
                                <Box sx={{width: 24, height: 2, backgroundColor: C.gold}}/>
                                <Typography sx={{fontSize: 11.5, fontWeight: 700, color: C.gold}}>
                                    {item.organization_name || 'Qurum xəbəri'}
                                </Typography>
                            </Box>
                            <Typography component="h1" sx={{
                                fontSize: {xs: 24, md: 32}, fontWeight: 700, color: C.ink,
                                lineHeight: 1.2, letterSpacing: '-0.02em',
                            }}>
                                {item.title}
                            </Typography>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, flexWrap: 'wrap'}}>
                                <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                                    {formatFull(item.published_at)}
                                </Typography>
                                {readingTime(item.body) && (
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                        <ScheduleOutlinedIcon sx={{fontSize: 14, color: C.inkFaint}}/>
                                        <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>
                                            {readingTime(item.body)}
                                        </Typography>
                                    </Box>
                                )}
                                {item.author_name && (
                                    <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>
                                        Müəllif: {item.author_name}
                                    </Typography>
                                )}
                            </Box>

                            {item.summary && (
                                <Typography sx={{
                                    fontSize: 15.5, color: C.ink, mt: 2.5, lineHeight: 1.65, fontWeight: 500,
                                    borderLeft: `3px solid ${C.gold}`, pl: 2,
                                }}>
                                    {item.summary}
                                </Typography>
                            )}

                            <Divider sx={{my: 3, borderColor: C.line}}/>

                            {paragraphs.length === 0 ? (
                                <Typography sx={{fontSize: 14, color: C.inkFaint}}>
                                    Bu xəbər üçün mətn əlavə edilməyib.
                                </Typography>
                            ) : paragraphs.map((p, i) => (
                                <Typography key={i} sx={{
                                    fontSize: 15, color: C.ink, lineHeight: 1.8, mb: 2, whiteSpace: 'pre-wrap',
                                    maxWidth: '72ch',
                                }}>
                                    {p}
                                </Typography>
                            ))}

                            <Divider sx={{my: 3, borderColor: C.line}}/>

                            <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                <Button size="small" startIcon={<LinkOutlinedIcon/>} onClick={copyLink}
                                        sx={{...softButtonSx, backgroundColor: 'transparent', border: `1px solid ${C.line}`, color: C.ink}}>
                                    Keçidi kopyala
                                </Button>
                                <Button size="small" startIcon={<PrintOutlinedIcon/>} onClick={() => window.print()}
                                        sx={{...softButtonSx, backgroundColor: 'transparent', border: `1px solid ${C.line}`, color: C.ink}}>
                                    Çap et
                                </Button>
                                {canManage && (
                                    <>
                                        <Button size="small" startIcon={<EditOutlinedIcon/>} onClick={() => setEditOpen(true)}
                                                sx={softButtonSx}>
                                            Redaktə et
                                        </Button>
                                        <Button size="small" startIcon={<DeleteOutlineIcon/>} onClick={() => setConfirmOpen(true)}
                                                sx={{textTransform: 'none', fontWeight: 600, fontSize: 12.5, borderRadius: '8px', color: C.danger, backgroundColor: C.dangerTint, px: 1.5}}>
                                            Sil
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Box sx={{...panelSx, p: 2.5, position: {md: 'sticky'}, top: {md: 24}}}>
                        <Typography sx={{fontSize: 14.5, fontWeight: 700, color: C.ink, mb: 1.75}}>
                            Digər xəbərlər
                        </Typography>
                        {others.length === 0 ? (
                            <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>
                                Arxivdə başqa xəbər yoxdur.
                            </Typography>
                        ) : others.map((n, idx) => (
                            <Box key={n.id} component={Link} href={`/elanlar/xeberler/${n.id}`}
                                 sx={{
                                     display: 'flex', gap: 1.25, py: 1.5, textDecoration: 'none',
                                     borderTop: idx === 0 ? 'none' : `1px solid ${C.line}`,
                                     '&:hover .rel-title': {color: C.goldDeep},
                                 }}>
                                {n.image_url ? (
                                    <Box component="img" src={n.image_url} alt={n.title}
                                         sx={{width: 64, height: 52, objectFit: 'cover', borderRadius: '8px', flexShrink: 0}}/>
                                ) : (
                                    <Box sx={{
                                        width: 64, height: 52, borderRadius: '8px', flexShrink: 0,
                                        backgroundColor: C.goldTint, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <NewspaperOutlinedIcon sx={{fontSize: 18, color: C.gold}}/>
                                    </Box>
                                )}
                                <Box sx={{minWidth: 0}}>
                                    <Typography className="rel-title" sx={{
                                        fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.35,
                                        transition: 'color .15s ease',
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {n.title}
                                    </Typography>
                                    <Typography sx={{fontSize: 11, color: C.inkFaint, mt: 0.4}}>
                                        {formatFull(n.published_at)}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                        <Button fullWidth component={Link} href="/elanlar/xeberler" sx={{...softButtonSx, mt: 2}}>
                            Bütün xəbərlər
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <NewsFormDialog open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} initial={item}/>

            <Dialog open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)} maxWidth="xs" fullWidth
                    PaperProps={{sx: dialogPaperSx}}>
                <Box sx={{p: 3}}>
                    <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>Xəbər silinsin?</Typography>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted, mt: 1}}>
                        “{item.title}” bütün istifadəçilər üçün siyahıdan çıxarılacaq. Bu əməliyyat geri qaytarılmır.
                    </Typography>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3}}>
                        <Button onClick={() => setConfirmOpen(false)} disabled={deleting}
                                sx={{color: C.inkMuted, textTransform: 'none'}}>İmtina</Button>
                        <Button onClick={handleDelete} disabled={deleting} variant="contained"
                                sx={{...primaryButtonSx, backgroundColor: C.danger, '&:hover': {backgroundColor: '#8B3131'}}}>
                            {deleting ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Sil'}
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}