"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import {useSnackbar} from "notistack";
import {useAppSelector} from "@/lib/hooks";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, EmptyState, NoAccess, StatusPill, TRAINING_ROUTES, fieldSx, formatDuration, formatFull,
    pageWrapSx, panelSx, primaryButtonSx, useTrainingPermissions,
} from "./trainingsShared";
import TrainingFormDialog from "./TrainingFormDialog";
import QuizEditorDialog from "./QuizEditorDialog";

function progressStatus(item) {
    if (!item.is_active) return 'archived';
    return item.my_progress?.status || 'not_started';
}

function TrainingCard({item, canManage, onEdit, onQuiz, onDelete}) {
    const status = progressStatus(item);
    return (
        <Box sx={{
            ...panelSx, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'border-color .15s ease', '&:hover': {borderColor: C.gold},
            opacity: item.is_active ? 1 : 0.7,
        }}>
            <Box component={Link} href={TRAINING_ROUTES.MATERIAL(item.id)}
                 sx={{position: 'relative', height: 168, backgroundColor: C.surfaceDeep, display: 'block'}}>
                {item.thumbnail_url ? (
                    <Box component="img" src={item.thumbnail_url} alt={item.title}
                         sx={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}/>
                ) : (
                    <Box sx={{
                        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `linear-gradient(135deg, #020624 0%, #141B33 100%)`,
                    }}>
                        <SchoolOutlinedIcon sx={{fontSize: 40, color: C.gold, opacity: 0.85}}/>
                    </Box>
                )}
                <PlayCircleOutlineIcon sx={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    fontSize: 54, color: 'rgba(255,255,255,0.92)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))',
                }}/>
                {item.duration_seconds > 0 && (
                    <Box sx={{
                        position: 'absolute', right: 10, bottom: 10, px: 0.75, py: 0.25, borderRadius: '6px',
                        backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11.5, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 0.5,
                    }}>
                        <AccessTimeIcon sx={{fontSize: 13}}/>{formatDuration(item.duration_seconds)}
                    </Box>
                )}
            </Box>

            <Box sx={{p: 2, flex: 1, display: 'flex', flexDirection: 'column', gap: 1}}>
                <Box sx={{display: 'flex', gap: 0.75, flexWrap: 'wrap'}}>
                    <StatusPill status={status}/>
                    {item.questions_count > 0 && (
                        item.my_quiz
                            ? <StatusPill status={item.my_quiz.passed ? 'passed' : 'failed'}
                                          label={`Quiz: ${item.my_quiz.best_percent}%`}/>
                            : <StatusPill status="not_started" label={`Quiz: ${item.questions_count} sual`}/>
                    )}
                </Box>
                <Typography component={Link} href={TRAINING_ROUTES.MATERIAL(item.id)} sx={{
                    fontSize: 15, fontWeight: 700, color: C.ink, lineHeight: 1.35, textDecoration: 'none',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    '&:hover': {color: C.goldDeep},
                }}>
                    {item.title}
                </Typography>
                {item.description && (
                    <Typography sx={{
                        fontSize: 12.5, color: C.inkMuted, lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {item.description}
                    </Typography>
                )}
                <Box sx={{flex: 1}}/>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                    <Typography sx={{fontSize: 11, color: C.inkFaint}}>
                        {formatFull(item.created_at)}{item.organization_name ? ` · ${item.organization_name}` : ''}
                    </Typography>
                    {canManage && (
                        <Box sx={{display: 'flex'}}>
                            <Tooltip title="Redaktə et"><IconButton size="small" onClick={() => onEdit(item)}><EditOutlinedIcon fontSize="small"/></IconButton></Tooltip>
                            <Tooltip title="Quiz"><IconButton size="small" onClick={() => onQuiz(item)}><QuizOutlinedIcon fontSize="small"/></IconButton></Tooltip>
                            <Tooltip title="Sil"><IconButton size="small" onClick={() => onDelete(item)}><DeleteOutlineIcon fontSize="small"/></IconButton></Tooltip>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export default function TrainingsListPage() {
    const {enqueueSnackbar} = useSnackbar();
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const perms = useTrainingPermissions();
    const canManage = perms.can_manage_materials;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [organizations, setOrganizations] = useState([]);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [quizFor, setQuizFor] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.TRAININGS.MATERIALS);
            setItems(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (perms.loaded && perms.can_view_materials) load();
    }, [perms.loaded, perms.can_view_materials, load]);

    useEffect(() => {
        if (!isRoot || !canManage) return;
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATION.LIST);
                setOrganizations(Array.isArray(res.data) ? res.data : (res.data?.results || []));
            } catch { /* qurum siyahısı olmadan da forma işləyir */ }
        })();
    }, [isRoot, canManage]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((it) => {
            if (q && !`${it.title} ${it.description}`.toLowerCase().includes(q)) return false;
            if (filter === 'all') return true;
            return progressStatus(it) === filter;
        });
    }, [items, search, filter]);

    const counts = useMemo(() => {
        const active = items.filter((i) => i.is_active);
        return {
            total: active.length,
            completed: active.filter((i) => i.my_progress?.status === 'completed').length,
        };
    }, [items]);

    async function handleDelete(item) {
        if (!window.confirm(`«${item.title}» təlimi silinsin?`)) return;
        try {
            const res = await service_api.delete(NEXT_API_ENDPOINTS.TRAININGS.MATERIAL_DETAIL(item.id));
            enqueueSnackbar(res.data?.detail || 'Təlim silindi.', {variant: res.data?.archived ? 'info' : 'success'});
            load();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        }
    }

    if (perms.loaded && !perms.can_view_materials) {
        return <NoAccess text="«Təlim materialları» bölməsinə giriş icazəniz yoxdur."/>;
    }

    return (
        <Box sx={pageWrapSx}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3}}>
                <TextField size="small" placeholder="Təlim axtar…" value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           sx={{...fieldSx, minWidth: 260, flex: {xs: 1, sm: 'none'}, backgroundColor: C.surface}}
                           InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>}}/>
                <TextField select size="small" value={filter} onChange={(e) => setFilter(e.target.value)}
                           sx={{...fieldSx, minWidth: 180, backgroundColor: C.surface}}>
                    <MenuItem value="all">Hamısı</MenuItem>
                    <MenuItem value="not_started">Baxılmayıb</MenuItem>
                    <MenuItem value="in_progress">Yarımçıq</MenuItem>
                    <MenuItem value="completed">Tam baxılıb</MenuItem>
                    {canManage && <MenuItem value="archived">Arxivdə</MenuItem>}
                </TextField>
                <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                    {counts.completed} / {counts.total} təlim tamamlanıb
                </Typography>
                <Box sx={{flex: 1}}/>
                {canManage && (
                    <Button variant="contained" startIcon={<AddIcon/>} sx={primaryButtonSx}
                            onClick={() => { setEditing(null); setFormOpen(true); }}>
                        Yeni təlim
                    </Button>
                )}
            </Box>

            {loading || !perms.loaded ? (
                <Grid container spacing={2.5}>
                    {[0, 1, 2].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rounded" height={300} sx={{borderRadius: '12px'}}/>
                        </Grid>
                    ))}
                </Grid>
            ) : visible.length === 0 ? (
                <EmptyState title="Təlim tapılmadı"
                            hint={canManage ? '«Yeni təlim» düyməsi ilə ilk videonu yükləyin.' : 'Hələ ki sizin üçün təlim materialı yoxdur.'}
                            icon={<SchoolOutlinedIcon/>}/>
            ) : (
                <Grid container spacing={2.5}>
                    {visible.map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item.id}>
                            <TrainingCard item={item} canManage={canManage}
                                          onEdit={(it) => { setEditing(it); setFormOpen(true); }}
                                          onQuiz={setQuizFor} onDelete={handleDelete}/>
                        </Grid>
                    ))}
                </Grid>
            )}

            {canManage && (
                <>
                    <TrainingFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSaved={load}
                                        initial={editing} isRoot={isRoot} organizations={organizations}/>
                    <QuizEditorDialog open={!!quizFor} training={quizFor} onClose={() => setQuizFor(null)} onSaved={load}/>
                </>
            )}
        </Box>
    );
}
