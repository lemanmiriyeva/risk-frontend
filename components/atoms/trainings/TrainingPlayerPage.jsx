"use client"
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Rating from '@mui/material/Rating';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {
    C, NoAccess, SectionHead, StatusPill, TRAINING_ROUTES, fieldSx, formatDuration, formatFull,
    pageWrapSx, panelSx, primaryButtonSx, softButtonSx, useTrainingPermissions,
} from "./trainingsShared";
import TrainingQuiz from "./TrainingQuiz";

const HEARTBEAT_MS = 5000;
// timeupdate hadisəsi ~250ms-dən bir gəlir; bundan böyük sıçrayış "irəli çəkmə"dir.
const SEEK_TOLERANCE = 1.5;

function FeedbackPanel({training, onSaved}) {
    const {enqueueSnackbar} = useSnackbar();
    const [rating, setRating] = useState(training.my_feedback?.rating || null);
    const [comment, setComment] = useState(training.my_feedback?.comment || '');
    const [saving, setSaving] = useState(false);

    async function save() {
        if (!rating && !comment.trim()) {
            enqueueSnackbar('Qiymət seçin və ya rəy yazın.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.TRAININGS.FEEDBACK(training.id), {rating, comment});
            enqueueSnackbar('Rəyiniz üçün təşəkkür edirik.', {variant: 'success'});
            onSaved?.(res.data);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    }

    return (
        <Box sx={panelSx}>
            <SectionHead icon={<RateReviewOutlinedIcon sx={{fontSize: 18}}/>} title="Rəy bildirin"/>
            <Box sx={{px: 2.5, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Rating value={rating} onChange={(e, v) => setRating(v)} sx={{color: C.gold}}/>
                    {rating && <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>{rating}/5</Typography>}
                </Box>
                <TextField size="small" multiline minRows={4} fullWidth sx={fieldSx}
                           placeholder="Təlim faydalı oldumu? Nəyi təkmilləşdirmək olar?"
                           value={comment} onChange={(e) => setComment(e.target.value)}/>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                    <Button variant="contained" sx={primaryButtonSx} onClick={save} disabled={saving}>
                        {training.my_feedback ? 'Rəyi yenilə' : 'Göndər'}
                    </Button>
                    {training.my_feedback && (
                        <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>
                            Son dəyişiklik: {formatFull(training.my_feedback.updated_at)}
                        </Typography>
                    )}
                </Box>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>
                    Rəyinizi yalnız təlim statistikasına baxmaq səlahiyyəti olan şəxslər görür.
                </Typography>
            </Box>
        </Box>
    );
}

export default function TrainingPlayerPage({id}) {
    const {enqueueSnackbar} = useSnackbar();
    const perms = useTrainingPermissions();

    const [training, setTraining] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completed, setCompleted] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [watched, setWatched] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [completing, setCompleting] = useState(false);

    const videoRef = useRef(null);
    const maxRef = useRef(0);
    const completedRef = useRef(false);
    const startedRef = useRef(false);
    const lastWarnRef = useRef(0);

    const load = useCallback(async () => {
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.TRAININGS.MATERIAL_DETAIL(id));
            setTraining(res.data);
            const done = res.data?.my_progress?.status === 'completed';
            completedRef.current = done;
            setCompleted(done);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (perms.loaded && perms.can_view_materials) load();
    }, [perms.loaded, perms.can_view_materials, load]);

    // Video metadata yüklənəndə sessiya başlayır. Tam baxılmamış videoda bu,
    // irəliləyişi sıfırlayır: yarımçıq çıxmış istifadəçi videonu əvvəldən izləməlidir.
    async function handleLoadedMetadata() {
        if (startedRef.current) return;
        startedRef.current = true;
        const duration = videoRef.current?.duration;
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.TRAININGS.START(id), {
                duration: Number.isFinite(duration) ? duration : 0,
            });
            if (res.data?.status === 'completed') {
                completedRef.current = true;
                setCompleted(true);
            } else {
                maxRef.current = 0;
                setWatched(0);
                if (videoRef.current) videoRef.current.currentTime = 0;
            }
            setSessionReady(true);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        }
    }

    function handleTimeUpdate() {
        const v = videoRef.current;
        if (!v || completedRef.current) return;
        if (v.currentTime <= maxRef.current + SEEK_TOLERANCE) {
            maxRef.current = Math.max(maxRef.current, v.currentTime);
            setWatched(maxRef.current);
        }
    }

    function handleSeeking() {
        const v = videoRef.current;
        if (!v || completedRef.current) return;
        if (v.currentTime > maxRef.current + SEEK_TOLERANCE) {
            v.currentTime = maxRef.current;
            const now = Date.now();
            if (now - lastWarnRef.current > 4000) {
                lastWarnRef.current = now;
                enqueueSnackbar('Videonu irəli çəkmək mümkün deyil - sona qədər izləməlisiniz.', {variant: 'info'});
            }
        }
    }

    function handleRateChange() {
        const v = videoRef.current;
        if (v && !completedRef.current && v.playbackRate !== 1) v.playbackRate = 1;
    }

    async function handleEnded() {
        setPlaying(false);
        if (completedRef.current) return;
        const v = videoRef.current;
        setCompleting(true);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.TRAININGS.COMPLETE(id), {
                position: v?.duration || maxRef.current,
            });
            if (res.data?.status === 'completed') {
                completedRef.current = true;
                setCompleted(true);
                enqueueSnackbar('Video tam izlənildi.', {variant: 'success'});
                load();
            }
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'warning'});
        } finally {
            setCompleting(false);
        }
    }

    // İzləmə zamanı server ~5 saniyədən bir məlumatlandırılır.
    useEffect(() => {
        if (!playing || completed || !sessionReady) return undefined;
        const timer = setInterval(() => {
            service_api.post(NEXT_API_ENDPOINTS.TRAININGS.PROGRESS(id), {position: maxRef.current}).catch(() => {});
        }, HEARTBEAT_MS);
        return () => clearInterval(timer);
    }, [playing, completed, sessionReady, id]);

    // Video yarımçıq ikən səhifədən çıxmaq istəyəndə xəbərdarlıq.
    useEffect(() => {
        if (completed || !sessionReady || watched <= 0) return undefined;
        const handler = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [completed, sessionReady, watched]);

    if (perms.loaded && !perms.can_view_materials) {
        return <NoAccess text="«Təlim materialları» bölməsinə giriş icazəniz yoxdur."/>;
    }

    if (loading || !perms.loaded) {
        return (
            <Box sx={pageWrapSx}>
                <Skeleton variant="rounded" height={480} sx={{borderRadius: '12px'}}/>
            </Box>
        );
    }

    if (!training) {
        return <NoAccess text="Təlim tapılmadı və ya artıq əlçatan deyil."/>;
    }

    const duration = training.duration_seconds || videoRef.current?.duration || 0;
    const pct = completed ? 100 : (duration ? Math.min(100, (watched / duration) * 100) : 0);
    const hasQuiz = training.questions_count > 0;

    return (
        <Box sx={pageWrapSx}>
            <Button component={Link} href={TRAINING_ROUTES.MATERIALS} startIcon={<ArrowBackIcon/>}
                    sx={{...softButtonSx, mb: 2.5}}>
                Bütün təlimlər
            </Button>

            <Box sx={{...panelSx, overflow: 'hidden', mb: 3}}>
                <Box sx={{backgroundColor: '#000', display: 'flex', justifyContent: 'center'}}>
                    <Box component="video"
                         ref={videoRef}
                         src={training.video_url}
                         controls
                         playsInline
                         preload="metadata"
                         controlsList={completed ? 'nodownload' : 'nodownload noplaybackrate'}
                         disablePictureInPicture
                         onContextMenu={(e) => e.preventDefault()}
                         poster={training.thumbnail_url || undefined}
                         onLoadedMetadata={handleLoadedMetadata}
                         onTimeUpdate={handleTimeUpdate}
                         onSeeking={handleSeeking}
                         onRateChange={handleRateChange}
                         onPlay={() => setPlaying(true)}
                         onPause={() => setPlaying(false)}
                         onEnded={handleEnded}
                         sx={{width: '100%', maxHeight: '68vh', display: 'block'}}/>
                </Box>
                <LinearProgress variant="determinate" value={pct}
                                sx={{height: 4, backgroundColor: C.surfaceDeep, '& .MuiLinearProgress-bar': {backgroundColor: completed ? '#2E6B3F' : C.gold}}}/>
                <Box sx={{p: {xs: 2, sm: 3}}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1}}>
                        <StatusPill status={completed ? 'completed' : (training.my_progress ? 'in_progress' : 'not_started')}/>
                        {duration > 0 && (
                            <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                                {completed ? formatDuration(duration) : `${formatDuration(watched)} / ${formatDuration(duration)}`}
                            </Typography>
                        )}
                        {completing && <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>Yoxlanılır…</Typography>}
                    </Box>
                    <Typography sx={{fontSize: {xs: 19, sm: 22}, fontWeight: 800, color: C.ink, lineHeight: 1.3}}>
                        {training.title}
                    </Typography>
                    <Typography sx={{fontSize: 12, color: C.inkFaint, mt: 0.5}}>
                        {formatFull(training.created_at)}
                        {training.organization_name ? ` · ${training.organization_name}` : ''}
                    </Typography>
                    {training.description && (
                        <Typography sx={{fontSize: 14, color: C.inkMuted, mt: 1.5, whiteSpace: 'pre-wrap', lineHeight: 1.6}}>
                            {training.description}
                        </Typography>
                    )}
                    {!completed && (
                        <Box sx={{
                            mt: 2, p: 1.5, borderRadius: '8px', backgroundColor: C.goldTint,
                            display: 'flex', gap: 1, alignItems: 'flex-start',
                        }}>
                            <InfoOutlinedIcon sx={{fontSize: 18, color: C.goldDeep, mt: 0.15}}/>
                            <Typography sx={{fontSize: 12.5, color: C.ink}}>
                                Video yalnız sona qədər izlənildikdə baxılmış sayılır. Yarımçıq çıxsanız, növbəti dəfə
                                video yenidən əvvəldən başlayacaq.{hasQuiz ? ' Video bitdikdən sonra quiz açılacaq.' : ''}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={hasQuiz ? 7 : 12} lg={hasQuiz ? 8 : 12}
                      sx={{display: hasQuiz ? 'block' : 'none'}}>
                    {hasQuiz && (completed ? (
                        <TrainingQuiz training={training} onSubmitted={() => load()}/>
                    ) : (
                        <Box sx={{...panelSx, p: 3, display: 'flex', gap: 1.5, alignItems: 'center'}}>
                            <LockOutlinedIcon sx={{color: C.inkFaint}}/>
                            <Box>
                                <Typography sx={{fontSize: 14.5, fontWeight: 700, color: C.ink}}>
                                    Quiz ({training.questions_count} sual)
                                </Typography>
                                <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                                    Videonu sona qədər izlədikdən sonra açılacaq.
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Grid>
                <Grid item xs={12} md={hasQuiz ? 5 : 12} lg={hasQuiz ? 4 : 12}>
                    {completed && !hasQuiz && (
                        <Box sx={{...panelSx, p: 2, mb: 3, display: 'flex', gap: 1, alignItems: 'center'}}>
                            <CheckCircleIcon sx={{color: '#2E6B3F'}}/>
                            <Typography sx={{fontSize: 13.5, color: C.ink}}>Bu təlimi tamamlamısınız.</Typography>
                        </Box>
                    )}
                    <FeedbackPanel key={training.my_feedback?.id || 'new'} training={training}
                                   onSaved={(fb) => setTraining((t) => ({...t, my_feedback: fb}))}/>
                </Grid>
            </Grid>
        </Box>
    );
}
