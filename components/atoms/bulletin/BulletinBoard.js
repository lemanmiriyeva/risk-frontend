"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CardSlider from "./CardSlider";
import CategoryManagerDialog from "./CategoryManagerDialog";
import {
    C, CategoryIcon, CircularFormDialog, EmptyState, NewsFormDialog,
    useBulletinCategories, useCanManageBulletin, formatDay, formatFull, initials,
    normalizeList, pageWrapSx, panelSx, softButtonSx,
} from "./bulletinShared";

const DOC_SLIDE_H = 172;
const NEWS_SLIDE_H = 460;
const BDAY_SLIDE_H = 460;

/* ===================================================================== */
/*  Panel başlığı                                                         */
/* ===================================================================== */

function PanelTitle({icon, title, count, onAdd, addLabel, size = 'md'}) {
    const big = size === 'lg';
    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, minWidth: 0}}>
            <Box sx={{
                width: big ? 32 : 26, height: big ? 32 : 26, borderRadius: '8px', flexShrink: 0,
                backgroundColor: C.goldTint, color: C.gold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {icon}
            </Box>
            <Typography sx={{
                fontSize: big ? 17 : 13.5, fontWeight: 700, color: C.ink, letterSpacing: '-0.01em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
                {title}
            </Typography>
            {count !== undefined && (
                <Box sx={{
                    minWidth: 19, height: 18, px: 0.65, borderRadius: '6px', flexShrink: 0,
                    backgroundColor: C.surfaceDeep, color: C.inkMuted,
                    fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {count}
                </Box>
            )}
            {onAdd && (
                <Tooltip title={addLabel}>
                    <IconButton size="small" onClick={onAdd} sx={{color: C.gold, flexShrink: 0}}>
                        <AddIcon sx={{fontSize: big ? 20 : 17}}/>
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );
}

/* ===================================================================== */
/*  Slayd kartları                                                        */
/* ===================================================================== */

function NewsSlide({item}) {
    return (
        <Box component={Link} href={`/elanlar/xeberler/${item.id}`}
             sx={{
                 display: 'flex', flexDirection: 'column', height: '100%', textDecoration: 'none',
                 border: `1px solid ${C.line}`, borderRadius: '10px', overflow: 'hidden',
                 backgroundColor: C.surface, transition: 'border-color .15s ease',
                 '&:hover': {borderColor: C.gold},
                 '&:hover .slide-title': {color: C.goldDeep},
             }}>
            <Box sx={{height: {xs: 180, md: 240}, flexShrink: 0, position: 'relative', backgroundColor: C.surfaceDeep}}>
                {item.image_url ? (
                    <Box component="img" src={item.image_url} alt={item.title}
                         sx={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}/>
                ) : (
                    <Box sx={{
                        width: '100%', height: '100%',
                        background: `linear-gradient(135deg, ${C.ink} 0%, #3A342A 65%, ${C.goldDeep} 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <NewspaperOutlinedIcon sx={{fontSize: 36, color: 'rgba(255,255,255,0.65)'}}/>
                    </Box>
                )}
                <Box sx={{
                    position: 'absolute', top: 12, left: 12, px: 1, py: 0.35, borderRadius: '6px',
                    backgroundColor: 'rgba(16,15,12,0.72)',
                }}>
                    <Typography sx={{fontSize: 11, fontWeight: 700, color: '#E8C97A'}}>
                        {formatFull(item.published_at)}
                    </Typography>
                </Box>
            </Box>
            <Box sx={{p: 2.25, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0}}>
                <Typography className="slide-title" sx={{
                    fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1.32, transition: 'color .15s ease',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                    {item.title}
                </Typography>
                {item.summary && (
                    <Typography sx={{
                        fontSize: 13, color: C.inkMuted, mt: 0.9, lineHeight: 1.55,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {item.summary}
                    </Typography>
                )}
                <Box sx={{flexGrow: 1}}/>
                <Typography sx={{fontSize: 12, fontWeight: 600, color: C.gold, mt: 1.25}}>
                    Xəbəri oxu →
                </Typography>
            </Box>
        </Box>
    );
}

function CircularSlide({item}) {
    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column', height: '100%',
            border: `1px solid ${C.line}`, borderRadius: '10px', p: 1.5,
            backgroundColor: C.surfaceRaised,
        }}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.85}}>
                {item.number && (
                    <Typography sx={{fontSize: 10.5, fontWeight: 700, color: C.gold}}>№ {item.number}</Typography>
                )}
                {item.document_date && (
                    <Typography sx={{fontSize: 10.5, color: C.inkFaint}}>{formatFull(item.document_date)}</Typography>
                )}
            </Box>

            <Box component={Link} href={`/elanlar/senedler/${item.id}`} sx={{textDecoration: 'none'}}>
                <Typography sx={{
                    fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    '&:hover': {color: C.goldDeep},
                }}>
                    {item.title}
                </Typography>
            </Box>

            <Typography sx={{fontSize: 10.5, color: C.inkFaint, mt: 0.5}}>
                {item.organization_name || 'Bütün qurumlar'}
            </Typography>

            <Box sx={{flexGrow: 1}}/>
            <Box sx={{display: 'flex', gap: 0.6, mt: 0.85}}>
                <Button size="small" component={Link} href={`/elanlar/senedler/${item.id}`}
                        sx={{...softButtonSx, fontSize: 10.5, py: 0.35, px: 1}}>
                    Ətraflı
                </Button>
                {item.file_url && (
                    <Button size="small" component="a" href={item.file_url} target="_blank" rel="noopener"
                            startIcon={<DownloadOutlinedIcon sx={{fontSize: 13}}/>}
                            sx={{
                                textTransform: 'none', fontSize: 10.5, fontWeight: 600, py: 0.35, px: 1,
                                borderRadius: '8px', color: C.inkMuted, border: `1px solid ${C.line}`,
                                backgroundColor: C.surface,
                            }}>
                        Yüklə
                    </Button>
                )}
            </Box>
        </Box>
    );
}

function BirthdaySlide({person}) {
    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', height: '100%', gap: 1, p: 2,
            border: `1px solid ${person.is_today ? C.gold : C.line}`, borderRadius: '10px',
            backgroundColor: person.is_today ? C.goldTint : C.surfaceRaised,
        }}>
            <Avatar src={person.image_url || undefined}
                    sx={{width: 84, height: 84, bgcolor: C.gold, color: '#fff', fontWeight: 700, fontSize: 26}}>
                {initials(person.name)}
            </Avatar>
            <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3, mt: 0.5}}>
                {person.name}
            </Typography>
            <Typography sx={{fontSize: 12.5, color: C.inkMuted, lineHeight: 1.4, maxWidth: 220}}>
                {[person.role_name, person.department_name].filter(Boolean).join(' · ') || '—'}
            </Typography>
            {person.is_today ? (
                <Chip label="Bu gün ad günüdür" size="small"
                      sx={{height: 23, fontSize: 11, fontWeight: 700, backgroundColor: C.gold, color: '#fff', mt: 0.5}}/>
            ) : (
                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: C.inkMuted, mt: 0.5}}>
                    {formatDay(person.birth_date)}
                </Typography>
            )}
        </Box>
    );
}

/* ===================================================================== */
/*  Sol sütun - Fərman / Sərəncam / Daxili qayda, alt-alta ayrıca slaydlar */
/* ===================================================================== */

function CircularsColumn({circulars, categories, categoriesLoading, canManage, isRoot, organizations, onRefresh, onCategoriesChanged}) {
    const [dialogCategoryId, setDialogCategoryId] = useState(null);
    const [managerOpen, setManagerOpen] = useState(false);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, height: '100%'}}>
            {canManage && (
                <Button size="small" startIcon={<SettingsOutlinedIcon sx={{fontSize: 16}}/>}
                        onClick={() => setManagerOpen(true)}
                        sx={{...softButtonSx, alignSelf: 'flex-start', fontSize: 11.5, py: 0.5}}>
                    Kateqoriyalar
                </Button>
            )}

            {!categoriesLoading && categories.length === 0 && (
                <Box sx={panelSx}>
                    <EmptyState
                        title="Hələ kateqoriya yaradılmayıb"
                        hint={canManage ? '"Kateqoriyalar" düyməsi ilə ilk növü (məs. Fərman) əlavə edin.' : 'Kateqoriyalar tezliklə əlavə olunacaq.'}
                    />
                </Box>
            )}

            {categories.map((cat) => {
                const list = circulars?.[cat.key] || [];
                return (
                    <Box key={cat.id} sx={{...panelSx, flex: 1}}>
                        <CardSlider
                            items={list}
                            height={DOC_SLIDE_H}
                            emptyState={<EmptyState title="Bu bölmədə sənəd yoxdur" hint={cat.description}/>}
                            headerSlot={(
                                <PanelTitle
                                    icon={<CategoryIcon icon={cat.icon}/>}
                                    title={cat.plural_label || cat.label}
                                    count={list.length}
                                    onAdd={canManage ? () => setDialogCategoryId(cat.id) : null}
                                    addLabel={`${cat.label} əlavə et`}
                                />
                            )}
                            renderItem={(item) => <CircularSlide item={item}/>}
                            footerSlot={(
                                <Button fullWidth size="small" component={Link}
                                        href={`/elanlar/senedler?category=${cat.key}`}
                                        sx={{...softButtonSx, fontSize: 11.5, py: 0.6}}>
                                    {list.length > 1 ? `Hamısına bax (${list.length})` : 'Bölməyə keç'}
                                </Button>
                            )}
                        />
                    </Box>
                );
            })}

            <CircularFormDialog
                open={!!dialogCategoryId}
                onClose={() => setDialogCategoryId(null)}
                onSaved={onRefresh}
                categories={categories}
                defaultCategoryId={dialogCategoryId}
                isRoot={isRoot}
                organizations={organizations}
            />

            <CategoryManagerDialog
                open={managerOpen}
                onClose={() => setManagerOpen(false)}
                categories={categories}
                loading={categoriesLoading}
                onChanged={() => { onCategoriesChanged(); onRefresh(); }}
            />
        </Box>
    );
}

/* ===================================================================== */
/*  Əsas komponent                                                        */
/* ===================================================================== */

export default function BulletinBoard() {
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const {canManage} = useCanManageBulletin();
    const {categories, loading: categoriesLoading, reload: reloadCategories} = useBulletinCategories();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState([]);
    const [newsFormOpen, setNewsFormOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.BULLETIN.DASHBOARD);
            setData(res.data);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!isRoot) return;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATION.LIST);
                setOrganizations(normalizeList(res.data));
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRoot]);

    const news = data?.news || [];
    const birthdays = useMemo(
        () => [...(data?.birthdays || [])].sort((a, b) => (b.is_today ? 1 : 0) - (a.is_today ? 1 : 0)),
        [data]
    );

    if (loading) {
        return (
            <Box sx={pageWrapSx}>
                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={3}>
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                            <Skeleton variant="rounded" height={172}/>
                            <Skeleton variant="rounded" height={172}/>
                            <Skeleton variant="rounded" height={172}/>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}><Skeleton variant="rounded" height={540}/></Grid>
                    <Grid item xs={12} md={3}><Skeleton variant="rounded" height={540}/></Grid>
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={pageWrapSx}>
            <Grid container spacing={2.5} alignItems="stretch">
                {/* Sol - normativ sənədlər, alt-alta üç panel */}
                <Grid item xs={12} md={3}>
                    <CircularsColumn
                        circulars={data?.circulars} categories={categories} categoriesLoading={categoriesLoading}
                        canManage={canManage} isRoot={isRoot} organizations={organizations}
                        onRefresh={load} onCategoriesChanged={reloadCategories}
                    />
                </Grid>

                {/* Orta - böyük xəbər bloku */}
                <Grid item xs={12} md={6}>
                    <Box sx={{...panelSx, height: '100%'}}>
                        <CardSlider
                            items={news}
                            height={NEWS_SLIDE_H}
                            emptyState={(
                                <EmptyState
                                    icon={<NewspaperOutlinedIcon sx={{fontSize: 34}}/>}
                                    title="Hələ xəbər dərc edilməyib"
                                    hint={canManage ? 'İlk xəbəri “+” düyməsi ilə əlavə edin.' : 'Yeni xəbərlər burada görünəcək.'}
                                />
                            )}
                            headerSlot={(
                                <PanelTitle
                                    size="lg"
                                    icon={<NewspaperOutlinedIcon sx={{fontSize: 20}}/>}
                                    title="Xəbərlər"
                                    count={news.length}
                                    onAdd={canManage ? () => setNewsFormOpen(true) : null}
                                    addLabel="Yeni xəbər"
                                />
                            )}
                            renderItem={(item) => <NewsSlide item={item}/>}
                            footerSlot={(
                                <Button fullWidth size="small" component={Link} href="/elanlar/xeberler" sx={softButtonSx}>
                                    Bütün xəbərlər
                                </Button>
                            )}
                        />
                    </Box>
                </Grid>

                {/* Sağ - ad günləri */}
                <Grid item xs={12} md={3}>
                    <Box sx={{...panelSx, height: '100%'}}>
                        <CardSlider
                            items={birthdays}
                            height={BDAY_SLIDE_H}
                            emptyState={(
                                <EmptyState
                                    icon={<CakeOutlinedIcon sx={{fontSize: 32}}/>}
                                    title="Bu ay ad günü olan əməkdaş yoxdur"
                                    hint="Növbəti ayın siyahısı ayın əvvəlində görünəcək."
                                />
                            )}
                            headerSlot={(
                                <PanelTitle
                                    icon={<CakeOutlinedIcon sx={{fontSize: 17}}/>}
                                    title="Ad günləri"
                                    count={birthdays.length}
                                />
                            )}
                            renderItem={(person) => <BirthdaySlide person={person}/>}
                            footerSlot={(
                                <Button fullWidth size="small" component={Link} href="/elanlar/ad-gunleri" sx={softButtonSx}>
                                    Ad günü təqvimi
                                </Button>
                            )}
                        />
                    </Box>
                </Grid>
            </Grid>

            <NewsFormDialog open={newsFormOpen} onClose={() => setNewsFormOpen(false)} onSaved={load}/>
        </Box>
    );
}