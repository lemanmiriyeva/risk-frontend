"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, CATEGORY_MAP, CircularFormDialog, EmptyState, canManageBulletin, dialogPaperSx,
    formatFull, normalizeList, pageWrapSx, panelSx, primaryButtonSx, softButtonSx,
} from "./bulletinShared";

function MetaRow({label, value}) {
    return (
        <Box sx={{display: 'flex', gap: 2, py: 1.25, borderTop: `1px solid ${C.line}`}}>
            <Typography sx={{fontSize: 12.5, color: C.inkFaint, width: 120, flexShrink: 0}}>{label}</Typography>
            <Typography sx={{fontSize: 13, color: C.ink, fontWeight: 500, minWidth: 0}}>{value || '—'}</Typography>
        </Box>
    );
}

export default function CircularDetailPage({id}) {
    const {enqueueSnackbar} = useSnackbar();
    const router = useRouter();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const canManage = canManageBulletin(user);

    const [item, setItem] = useState(null);
    const [related, setRelated] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setNotFound(false);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.CIRCULAR_DETAIL(id));
            setItem(res.data);
        } catch (err) {
            try {
                const listRes = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.CIRCULARS);
                const found = normalizeList(listRes.data).find((c) => String(c.id) === String(id));
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
                const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.CIRCULARS);
                setRelated(normalizeList(res.data));
            } catch (e) {
                // yan sütun kritik deyil
            }
        })();
    }, [id]);

    useEffect(() => {
        if (!isRoot) return;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATION.LIST);
                setOrganizations(normalizeList(res.data));
            } catch (e) {
                // kritik deyil
            }
        })();
    }, [isRoot]);

    const sameCategory = useMemo(() => related
        .filter((c) => String(c.id) !== String(id) && c.category === item?.category)
        .slice(0, 6), [related, id, item]);

    const isPdf = useMemo(() => {
        const url = (item?.file_url || '').split('?')[0].toLowerCase();
        return url.endsWith('.pdf');
    }, [item]);

    async function handleDelete() {
        setDeleting(true);
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.BULLETIN.CIRCULAR_DETAIL(id));
            enqueueSnackbar('Sənəd silindi.', {variant: 'success'});
            router.push('/elanlar/senedler');
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
                <Skeleton variant="text" height={44} width="60%"/>
                <Skeleton variant="text" height={20} width="35%" sx={{mb: 3}}/>
                <Skeleton variant="rounded" height={420}/>
            </Box>
        );
    }

    if (notFound || !item) {
        return (
            <Box sx={pageWrapSx}>
                <Box sx={panelSx}>
                    <EmptyState
                        icon={<FolderOutlinedIcon sx={{fontSize: 34}}/>}
                        title="Sənəd tapılmadı"
                        hint="Sənəd silinmiş və ya keçid səhv ola bilər."
                    />
                    <Box sx={{display: 'flex', justifyContent: 'center', pb: 3}}>
                        <Button component={Link} href="/elanlar/senedler" sx={softButtonSx}>
                            Sənəd arxivinə qayıt
                        </Button>
                    </Box>
                </Box>
            </Box>
        );
    }

    const cat = CATEGORY_MAP[item.category];

    return (
        <Box sx={pageWrapSx}>
            <Button component={Link} href={`/elanlar/senedler?category=${item.category || ''}`}
                    startIcon={<ArrowBackIcon sx={{fontSize: 13}}/>}
                    sx={{textTransform: 'none', color: C.inkMuted, mb: 2, fontSize: 13}}>
                {cat ? cat.plural : 'Sənədlər'}
            </Button>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Box sx={{...panelSx, p: {xs: 2.5, md: 3.5}}}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1.5}}>
                            <Box sx={{
                                width: 30, height: 30, borderRadius: '8px',
                                backgroundColor: C.goldTint, color: C.gold,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {cat ? cat.icon : <DescriptionOutlinedIcon sx={{fontSize: 18}}/>}
                            </Box>
                            <Typography sx={{fontSize: 12.5, fontWeight: 700, color: C.gold}}>
                                {cat ? cat.label : 'Sənəd'}
                            </Typography>
                        </Box>

                        <Typography component="h1" sx={{
                            fontSize: {xs: 21, md: 26}, fontWeight: 700, color: C.ink,
                            lineHeight: 1.25, letterSpacing: '-0.015em',
                        }}>
                            {item.title}
                        </Typography>

                        <Box sx={{mt: 2.5}}>
                            <MetaRow label="Nömrə" value={item.number ? `№ ${item.number}` : ''}/>
                            <MetaRow label="Sənəd tarixi" value={formatFull(item.document_date)}/>
                            <MetaRow label="Aid olduğu qurum" value={item.organization_name || 'Bütün qurumlar'}/>
                            <MetaRow label="Sistemə əlavə edilib" value={formatFull(item.created_at)}/>
                            {item.created_by_name && <MetaRow label="Əlavə edən" value={item.created_by_name}/>}
                        </Box>

                        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3}}>
                            {item.file_url && (
                                <Button component="a" href={item.file_url} target="_blank" rel="noopener"
                                        startIcon={<DownloadOutlinedIcon/>} variant="contained" sx={primaryButtonSx}>
                                    Faylı yüklə
                                </Button>
                            )}
                            <Button startIcon={<LinkOutlinedIcon/>} onClick={copyLink}
                                    sx={{...softButtonSx, backgroundColor: 'transparent', border: `1px solid ${C.line}`, color: C.ink}}>
                                Keçidi kopyala
                            </Button>
                            {canManage && (
                                <>
                                    <Button startIcon={<EditOutlinedIcon/>} onClick={() => setEditOpen(true)} sx={softButtonSx}>
                                        Redaktə et
                                    </Button>
                                    <Button startIcon={<DeleteOutlineIcon/>} onClick={() => setConfirmOpen(true)}
                                            sx={{textTransform: 'none', fontWeight: 600, fontSize: 12.5, borderRadius: '8px', color: C.danger, backgroundColor: C.dangerTint, px: 1.5}}>
                                        Sil
                                    </Button>
                                </>
                            )}
                        </Box>
                    </Box>

                    {/* Fayl önizləməsi */}
                    <Box sx={{...panelSx, mt: 3, overflow: 'hidden'}}>
                        <Box sx={{px: 2.5, py: 1.75, borderBottom: `1px solid ${C.line}`}}>
                            <Typography sx={{fontSize: 14, fontWeight: 700, color: C.ink}}>Sənədin mətni</Typography>
                        </Box>
                        {item.file_url && isPdf ? (
                            <Box component="iframe" src={item.file_url} title={item.title}
                                 sx={{width: '100%', height: 620, border: 'none', display: 'block'}}/>
                        ) : item.file_url ? (
                            <Box sx={{p: 3, textAlign: 'center'}}>
                                <DescriptionOutlinedIcon sx={{fontSize: 34, color: C.lineStrong}}/>
                                <Typography sx={{fontSize: 13.5, color: C.inkMuted, mt: 1}}>
                                    Bu fayl brauzerdə göstərilmir. Yükləyərək aça bilərsiniz.
                                </Typography>
                            </Box>
                        ) : (
                            <EmptyState
                                icon={<DescriptionOutlinedIcon sx={{fontSize: 34}}/>}
                                title="Fayl əlavə edilməyib"
                                hint={canManage ? 'Redaktə edərək sənədin faylını yükləyə bilərsiniz.' : 'Sənədin faylı sonradan əlavə oluna bilər.'}
                            />
                        )}
                    </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Box sx={{...panelSx, p: 2.5, position: {md: 'sticky'}, top: {md: 24}}}>
                        <Typography sx={{fontSize: 14.5, fontWeight: 700, color: C.ink, mb: 1.5}}>
                            Eyni bölmədən
                        </Typography>
                        {sameCategory.length === 0 ? (
                            <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>
                                Bu bölmədə başqa sənəd yoxdur.
                            </Typography>
                        ) : sameCategory.map((c, idx) => (
                            <Box key={c.id} component={Link} href={`/elanlar/senedler/${c.id}`}
                                 sx={{
                                     display: 'block', py: 1.5, textDecoration: 'none',
                                     borderTop: idx === 0 ? 'none' : `1px solid ${C.line}`,
                                     '&:hover .rel-doc': {color: C.goldDeep},
                                 }}>
                                <Typography className="rel-doc" sx={{
                                    fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.4,
                                    transition: 'color .15s ease',
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                }}>
                                    {c.title}
                                </Typography>
                                <Typography sx={{fontSize: 11, color: C.inkFaint, mt: 0.3}}>
                                    {[c.number ? `№ ${c.number}` : '', formatFull(c.document_date)].filter(Boolean).join(' · ')}
                                </Typography>
                            </Box>
                        ))}
                        <Button fullWidth component={Link} href="/elanlar/senedler" sx={{...softButtonSx, mt: 2}}>
                            Bütün sənədlər
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <CircularFormDialog
                open={editOpen} onClose={() => setEditOpen(false)} onSaved={load}
                defaultCategory={item.category} isRoot={isRoot} organizations={organizations} initial={item}
            />

            <Dialog open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)} maxWidth="xs" fullWidth
                    PaperProps={{sx: dialogPaperSx}}>
                <Box sx={{p: 3}}>
                    <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>Sənəd silinsin?</Typography>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted, mt: 1}}>
                        “{item.title}” arxivdən çıxarılacaq. Bu əməliyyat geri qaytarılmır.
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
