"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Dialog from '@mui/material/Dialog';
import Rating from '@mui/material/Rating';
import CircularProgress from '@mui/material/CircularProgress';
import {DataGrid} from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import {useSnackbar} from "notistack";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";
import {DATA_GRID_LOCALE_AZ} from "@/lib/dataGridLocaleAz";
import {
    C, NoAccess, StatusPill, dialogPaperSx, fieldSx, pageWrapSx, panelSx, softButtonSx,
    useTrainingPermissions,
} from "./trainingsShared";

const gridSx = {
    border: `1px solid ${C.line}`,
    borderRadius: '10px',
    backgroundColor: C.surface,
    '& .MuiDataGrid-columnHeaders': {backgroundColor: C.surface, borderBottom: `1px solid ${C.lineStrong}`},
    '& .MuiDataGrid-columnHeaderTitle': {fontSize: 11, letterSpacing: '0.05em', color: C.inkFaint, textTransform: 'uppercase', fontWeight: 500},
    '& .MuiDataGrid-cell': {borderBottom: `1px solid ${C.line}`, fontSize: 13.5, color: C.ink, display: 'flex', alignItems: 'center'},
    '& .MuiDataGrid-row:hover': {backgroundColor: 'rgba(0,0,0,0.015)'},
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {outline: 'none'},
    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {outline: 'none'},
    '& .MuiDataGrid-footerContainer': {borderTop: `1px solid ${C.line}`},
};

const TABS = [
    {key: 'overview', label: 'Təlimlər üzrə'},
    {key: 'views', label: 'Baxışlar'},
    {key: 'not_started', label: 'Baxmayanlar'},
    {key: 'quiz', label: 'Quiz nəticələri'},
    {key: 'feedback', label: 'Rəylər'},
];

function formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('az-AZ', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'});
}

const userCol = {
    field: 'user', headerName: 'Əməkdaş', flex: 1.2, minWidth: 190, sortable: false,
    renderCell: ({row}) => (
        <Box sx={{lineHeight: 1.25, py: 0.5}}>
            <Typography sx={{fontSize: 13.5, color: C.ink, fontWeight: 600}}>{row.user?.name}</Typography>
            <Typography sx={{fontSize: 11.5, color: C.inkFaint}}>
                {[row.user?.department, row.user?.organization].filter(Boolean).join(' · ') || row.user?.username}
            </Typography>
        </Box>
    ),
};
const trainingCol = {field: 'training_title', headerName: 'Təlim', flex: 1.2, minWidth: 180, sortable: false};

function Kpi({label, value, hint}) {
    return (
        <Box sx={{...panelSx, p: 2, height: '100%'}}>
            <Typography sx={{fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.inkFaint}}>{label}</Typography>
            <Typography sx={{fontSize: 26, fontWeight: 800, color: C.ink, mt: 0.5, fontVariantNumeric: 'tabular-nums'}}>{value}</Typography>
            {hint && <Typography sx={{fontSize: 11.5, color: C.inkMuted}}>{hint}</Typography>}
        </Box>
    );
}

/** DRF səhifələnmiş siyahısını DataGrid-in server rejimi üçün yükləyir. */
function useServerList(endpoint, params, enabled) {
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [paginationModel, setPaginationModel] = useState({page: 0, pageSize: 20});
    const paramsKey = JSON.stringify(params);

    useEffect(() => { setPaginationModel((m) => (m.page === 0 ? m : {...m, page: 0})); }, [paramsKey]);

    const load = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        try {
            const query = new URLSearchParams({
                ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)),
                page: String(paginationModel.page + 1),
                page_size: String(paginationModel.pageSize),
            });
            const res = await service_api.get(`${endpoint}?${query.toString()}`);
            setRows(res.data?.results || []);
            setCount(res.data?.count || 0);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint, paramsKey, paginationModel, enabled]);

    useEffect(() => { load(); }, [load]);

    return {rows, count, loading, paginationModel, setPaginationModel, reload: load};
}

function QuizAttemptDialog({attemptId, onClose}) {
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!attemptId) { setData(null); return; }
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.TRAININGS.STATS_QUIZ_DETAIL(attemptId));
                setData(res.data);
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId]);

    return (
        <Dialog open={!!attemptId} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{sx: dialogPaperSx}}>
            <Box sx={{px: 3, pt: 3, pb: 2, borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <Box>
                    <Typography sx={{fontSize: 17, fontWeight: 700, color: C.ink}}>{data?.user?.name || 'Quiz nəticəsi'}</Typography>
                    {data && (
                        <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>
                            {data.training_title} · {formatDateTime(data.submitted_at)}
                        </Typography>
                    )}
                </Box>
                <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small"/></IconButton>
            </Box>
            <Box sx={{px: 3, py: 2.5, maxHeight: '65vh', overflowY: 'auto'}}>
                {!data ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress size={22} sx={{color: C.gold}}/></Box>
                ) : (
                    <>
                        <Box sx={{display: 'flex', gap: 1, alignItems: 'center', mb: 2}}>
                            <Typography sx={{fontSize: 22, fontWeight: 800, color: C.ink}}>{data.percent}%</Typography>
                            <Typography sx={{fontSize: 13, color: C.inkMuted}}>{data.correct_count}/{data.total_count} düzgün</Typography>
                            <StatusPill status={data.passed ? 'passed' : 'failed'}/>
                        </Box>
                        {data.answers.map((a, i) => (
                            <Box key={a.id} sx={{py: 1.25, borderTop: `1px solid ${C.line}`}}>
                                <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-start'}}>
                                    {a.is_correct
                                        ? <CheckCircleIcon sx={{fontSize: 18, color: '#1F7A4D', mt: 0.25}}/>
                                        : <CancelIcon sx={{fontSize: 18, color: C.danger, mt: 0.25}}/>}
                                    <Box>
                                        <Typography sx={{fontSize: 13.5, fontWeight: 600, color: C.ink}}>{i + 1}. {a.question_text}</Typography>
                                        <Typography sx={{fontSize: 12.5, color: C.inkMuted}}>Cavab: {a.selected_text || '—'}</Typography>
                                        {!a.is_correct && (
                                            <Typography sx={{fontSize: 12.5, color: '#1F7A4D'}}>Düzgün cavab: {a.correct_text}</Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </>
                )}
            </Box>
        </Dialog>
    );
}

export default function TrainingStatisticsPage() {
    const {enqueueSnackbar} = useSnackbar();
    const perms = useTrainingPermissions();
    const enabled = perms.loaded && perms.can_view_statistics;
    const canManage = perms.can_manage_statistics;

    const [tab, setTab] = useState('overview');
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [training, setTraining] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [viewStatus, setViewStatus] = useState('');
    const [passed, setPassed] = useState('');
    const [exporting, setExporting] = useState(false);
    const [attemptId, setAttemptId] = useState(null);
    const [notStarted, setNotStarted] = useState({rows: [], loading: false});

    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    const loadSummary = useCallback(async () => {
        if (!enabled) return;
        setSummaryLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.TRAININGS.STATS_SUMMARY);
            setSummary(res.data);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setSummaryLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    useEffect(() => { loadSummary(); }, [loadSummary]);

    const common = {training, date_from: dateFrom, date_to: dateTo, search};
    const views = useServerList(NEXT_API_ENDPOINTS.TRAININGS.STATS_VIEWS, {...common, status: viewStatus}, enabled && tab === 'views');
    const quiz = useServerList(NEXT_API_ENDPOINTS.TRAININGS.STATS_QUIZ, {...common, passed}, enabled && tab === 'quiz');
    const feedback = useServerList(NEXT_API_ENDPOINTS.TRAININGS.STATS_FEEDBACK, common, enabled && tab === 'feedback');

    useEffect(() => {
        if (!enabled || tab !== 'not_started' || !training) {
            setNotStarted({rows: [], loading: false});
            return;
        }
        let alive = true;
        setNotStarted((s) => ({...s, loading: true}));
        (async () => {
            try {
                const q = new URLSearchParams({training, ...(search ? {search} : {})});
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.TRAININGS.STATS_NOT_STARTED}?${q}`);
                if (alive) setNotStarted({rows: res.data || [], loading: false});
            } catch (err) {
                enqueueSnackbar(handleError(err), {variant: 'error'});
                if (alive) setNotStarted({rows: [], loading: false});
            }
        })();
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, tab, training, search]);

    const trainingRows = summary?.trainings || [];
    const totals = useMemo(() => {
        const rows = training ? trainingRows.filter((r) => String(r.id) === String(training)) : trainingRows;
        const sum = (k) => rows.reduce((acc, r) => acc + (r[k] || 0), 0);
        const quizRows = rows.filter((r) => r.quiz_avg_percent !== null && r.quiz_attempts > 0);
        const quizAttempts = quizRows.reduce((acc, r) => acc + r.quiz_attempts, 0);
        const quizAvg = quizAttempts
            ? quizRows.reduce((acc, r) => acc + r.quiz_avg_percent * r.quiz_attempts, 0) / quizAttempts
            : null;
        const audience = sum('audience');
        return {
            trainings: rows.length,
            completed: sum('completed'),
            in_progress: sum('in_progress'),
            not_started: sum('not_started'),
            audience,
            quizAttempts,
            quizAvg,
            feedback: sum('feedback_count'),
        };
    }, [trainingRows, training]);

    async function handleExport() {
        setExporting(true);
        try {
            const q = new URLSearchParams(
                Object.fromEntries(Object.entries({training, date_from: dateFrom, date_to: dateTo}).filter(([, v]) => v)),
            );
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.TRAININGS.STATS_EXPORT}?${q}`, {responseType: 'blob', timeout: 0});
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `telim_statistikasi_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        } finally {
            setExporting(false);
        }
    }

    async function removeRow(kind, row) {
        const config = {
            views: {
                msg: `${row.user?.name} üçün «${row.training_title}» baxış qeydi sıfırlansın? İstifadəçi videonu yenidən izləməli olacaq.`,
                url: NEXT_API_ENDPOINTS.TRAININGS.STATS_VIEW_DETAIL(row.id), reload: views.reload,
            },
            quiz: {
                msg: `${row.user?.name} — ${row.percent}% nəticəsi silinsin?`,
                url: NEXT_API_ENDPOINTS.TRAININGS.STATS_QUIZ_DETAIL(row.id), reload: quiz.reload,
            },
            feedback: {
                msg: `${row.user?.name} istifadəçisinin rəyi silinsin?`,
                url: NEXT_API_ENDPOINTS.TRAININGS.STATS_FEEDBACK_DETAIL(row.id), reload: feedback.reload,
            },
        }[kind];
        if (!window.confirm(config.msg)) return;
        try {
            await service_api.delete(config.url);
            enqueueSnackbar('Yerinə yetirildi.', {variant: 'success'});
            config.reload();
            loadSummary();
        } catch (err) {
            enqueueSnackbar(handleError(err), {variant: 'error'});
        }
    }

    const actionCol = (kind, extra) => ({
        field: '__actions', headerName: '', width: canManage ? 96 : 56, sortable: false, align: 'right',
        renderCell: ({row}) => (
            <Box>
                {extra?.(row)}
                {canManage && (
                    <Tooltip title={kind === 'views' ? 'Baxışı sıfırla' : 'Sil'}>
                        <IconButton size="small" onClick={() => removeRow(kind, row)}>
                            {kind === 'views' ? <RestartAltIcon fontSize="small"/> : <DeleteOutlineIcon fontSize="small"/>}
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        ),
    });

    const overviewColumns = [
        {field: 'title', headerName: 'Təlim', flex: 1.6, minWidth: 220,
            renderCell: ({row}) => (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Typography sx={{fontSize: 13.5, fontWeight: 600, color: C.ink}}>{row.title}</Typography>
                    {!row.is_active && <StatusPill status="archived"/>}
                </Box>
            )},
        {field: 'audience', headerName: 'Auditoriya', width: 110, type: 'number'},
        {field: 'completed', headerName: 'Tam baxıb', width: 110, type: 'number'},
        {field: 'in_progress', headerName: 'Yarımçıq', width: 100, type: 'number'},
        {field: 'not_started', headerName: 'Baxmayıb', width: 100, type: 'number'},
        {field: 'quiz_attempts', headerName: 'Quiz cəhdi', width: 110, type: 'number'},
        {field: 'quiz_avg_percent', headerName: 'Orta bal', width: 100, type: 'number',
            valueFormatter: (v) => (v === null || v === undefined ? '—' : `${v}%`)},
        {field: 'quiz_passed_users', headerName: 'Keçən', width: 90, type: 'number'},
        {field: 'avg_rating', headerName: 'Reytinq', width: 100, type: 'number',
            valueFormatter: (v) => (v === null || v === undefined ? '—' : `${v} / 5`)},
    ];

    const viewColumns = [
        userCol, trainingCol,
        {field: 'status', headerName: 'Status', width: 130, sortable: false,
            renderCell: ({row}) => <StatusPill status={row.status} label={row.status_label}/>},
        {field: 'attempts_count', headerName: 'Başlama sayı', width: 120, type: 'number'},
        {field: 'first_started_at', headerName: 'İlk baxış', width: 160, valueFormatter: (v) => formatDateTime(v)},
        {field: 'completed_at', headerName: 'Tam baxılıb', width: 160, valueFormatter: (v) => formatDateTime(v)},
        {field: 'last_heartbeat_at', headerName: 'Son aktivlik', width: 160, valueFormatter: (v) => formatDateTime(v)},
        ...(canManage ? [actionCol('views')] : []),
    ];

    const quizColumns = [
        userCol, trainingCol,
        {field: 'percent', headerName: 'Nəticə', width: 100, type: 'number', valueFormatter: (v) => `${v}%`},
        {field: 'correct_count', headerName: 'Düzgün', width: 100, sortable: false,
            valueGetter: (v, row) => `${row.correct_count}/${row.total_count}`},
        {field: 'passed', headerName: 'Status', width: 110, sortable: false,
            renderCell: ({row}) => <StatusPill status={row.passed ? 'passed' : 'failed'}/>},
        {field: 'submitted_at', headerName: 'Təsdiqlənib', width: 160, valueFormatter: (v) => formatDateTime(v)},
        actionCol('quiz', (row) => (
            <Tooltip title="Cavablara bax">
                <IconButton size="small" onClick={() => setAttemptId(row.id)}><VisibilityOutlinedIcon fontSize="small"/></IconButton>
            </Tooltip>
        )),
    ];

    const feedbackColumns = [
        userCol, trainingCol,
        {field: 'rating', headerName: 'Qiymət', width: 140,
            renderCell: ({row}) => row.rating
                ? <Rating size="small" value={row.rating} readOnly sx={{color: C.gold}}/>
                : <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>—</Typography>},
        {field: 'comment', headerName: 'Rəy', flex: 2, minWidth: 260, sortable: false,
            renderCell: ({row}) => (
                <Tooltip title={row.comment || ''}>
                    <Typography sx={{fontSize: 13, color: C.ink, whiteSpace: 'normal', lineHeight: 1.4, py: 0.75,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                        {row.comment || '—'}
                    </Typography>
                </Tooltip>
            )},
        {field: 'updated_at', headerName: 'Tarix', width: 160, valueFormatter: (v) => formatDateTime(v)},
        ...(canManage ? [actionCol('feedback')] : []),
    ];

    const notStartedColumns = [
        {field: 'name', headerName: 'Əməkdaş', flex: 1.2, minWidth: 200},
        {field: 'department', headerName: 'Şöbə', flex: 1, minWidth: 160, valueFormatter: (v) => v || '—'},
        {field: 'organization', headerName: 'Qurum', flex: 1, minWidth: 160, valueFormatter: (v) => v || '—'},
    ];

    if (perms.loaded && !perms.can_view_statistics) {
        return <NoAccess text="«Təlim statistikası» bölməsinə giriş icazəniz yoxdur."/>;
    }

    const serverGridProps = (list) => ({
        rows: list.rows,
        loading: list.loading,
        rowCount: list.count,
        paginationMode: 'server',
        paginationModel: list.paginationModel,
        onPaginationModelChange: list.setPaginationModel,
        pageSizeOptions: [20, 50, 100],
    });

    const baseGridProps = {
        getRowId: (row) => row.id,
        disableRowSelectionOnClick: true,
        disableColumnFilter: true,
        disableColumnMenu: true,
        getRowHeight: () => 'auto',
        localeText: DATA_GRID_LOCALE_AZ,
        sx: {...gridSx, '& .MuiDataGrid-cell': {...gridSx['& .MuiDataGrid-cell'], py: 0.75}},
    };

    const showDates = tab !== 'overview' && tab !== 'not_started';

    return (
        <Box sx={pageWrapSx}>
            <Grid container spacing={2} sx={{mb: 3}}>
                <Grid item xs={6} md={3}><Kpi label="Tam baxış" value={summaryLoading ? '…' : totals.completed}
                                               hint={totals.audience ? `${Math.round((totals.completed / Math.max(totals.audience, 1)) * 100)}% auditoriyadan` : null}/></Grid>
                <Grid item xs={6} md={3}><Kpi label="Yarımçıq / baxmayıb" value={summaryLoading ? '…' : `${totals.in_progress} / ${totals.not_started}`}/></Grid>
                <Grid item xs={6} md={3}><Kpi label="Quiz cəhdi" value={summaryLoading ? '…' : totals.quizAttempts}
                                               hint={totals.quizAvg !== null ? `Orta bal: ${totals.quizAvg.toFixed(1)}%` : null}/></Grid>
                <Grid item xs={6} md={3}><Kpi label="Rəy" value={summaryLoading ? '…' : totals.feedback}
                                               hint={`${totals.trainings} təlim`}/></Grid>
            </Grid>

            <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2}}>
                <TextField select size="small" label="Təlim" value={training} onChange={(e) => setTraining(e.target.value)}
                           sx={{...fieldSx, minWidth: 240, backgroundColor: C.surface}}>
                    <MenuItem value="">Bütün təlimlər</MenuItem>
                    {trainingRows.map((t) => <MenuItem key={t.id} value={t.id}>{t.title}{t.is_active ? '' : ' (arxiv)'}</MenuItem>)}
                </TextField>
                {tab !== 'overview' && (
                    <TextField size="small" placeholder="Əməkdaş, şöbə…" value={searchInput}
                               onChange={(e) => setSearchInput(e.target.value)}
                               sx={{...fieldSx, minWidth: 220, backgroundColor: C.surface}}
                               InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment>}}/>
                )}
                {showDates && (
                    <>
                        <TextField size="small" type="date" label="Tarixdən" InputLabelProps={{shrink: true}}
                                   value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                   sx={{...fieldSx, width: 165, backgroundColor: C.surface}}/>
                        <TextField size="small" type="date" label="Tarixədək" InputLabelProps={{shrink: true}}
                                   value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                   sx={{...fieldSx, width: 165, backgroundColor: C.surface}}/>
                    </>
                )}
                {tab === 'views' && (
                    <TextField select size="small" label="Status" value={viewStatus} onChange={(e) => setViewStatus(e.target.value)}
                               sx={{...fieldSx, minWidth: 150, backgroundColor: C.surface}}>
                        <MenuItem value="">Hamısı</MenuItem>
                        <MenuItem value="completed">Tam baxılıb</MenuItem>
                        <MenuItem value="in_progress">Yarımçıq</MenuItem>
                    </TextField>
                )}
                {tab === 'quiz' && (
                    <TextField select size="small" label="Nəticə" value={passed} onChange={(e) => setPassed(e.target.value)}
                               sx={{...fieldSx, minWidth: 140, backgroundColor: C.surface}}>
                        <MenuItem value="">Hamısı</MenuItem>
                        <MenuItem value="true">Keçdi</MenuItem>
                        <MenuItem value="false">Keçmədi</MenuItem>
                    </TextField>
                )}
                <Box sx={{flex: 1}}/>
                <Button startIcon={exporting ? <CircularProgress size={14} sx={{color: C.goldDeep}}/> : <FileDownloadOutlinedIcon/>}
                        sx={softButtonSx} onClick={handleExport} disabled={exporting || !enabled}>
                    Excel-ə ixrac
                </Button>
            </Box>

            <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile
                  sx={{
                      mb: 2, minHeight: 38, borderBottom: `1px solid ${C.line}`,
                      '& .MuiTab-root': {textTransform: 'none', minHeight: 38, fontSize: 13.5, color: C.inkMuted},
                      '& .Mui-selected': {color: `${C.ink} !important`, fontWeight: 600},
                      '& .MuiTabs-indicator': {backgroundColor: C.gold},
                  }}>
                {TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label}/>)}
            </Tabs>

            <Box sx={{height: {xs: 520, md: 620}, width: '100%'}}>
                {tab === 'overview' && (
                    <DataGrid {...baseGridProps} columns={overviewColumns} loading={summaryLoading}
                              rows={training ? trainingRows.filter((r) => String(r.id) === String(training)) : trainingRows}
                              pageSizeOptions={[20, 50, 100]}
                              initialState={{pagination: {paginationModel: {pageSize: 20}}}}
                              onRowClick={({row}) => { setTraining(row.id); setTab('views'); }}
                              sx={{...baseGridProps.sx, '& .MuiDataGrid-row': {cursor: 'pointer'}}}/>
                )}
                {tab === 'views' && <DataGrid {...baseGridProps} {...serverGridProps(views)} columns={viewColumns}/>}
                {tab === 'quiz' && <DataGrid {...baseGridProps} {...serverGridProps(quiz)} columns={quizColumns}/>}
                {tab === 'feedback' && <DataGrid {...baseGridProps} {...serverGridProps(feedback)} columns={feedbackColumns}/>}
                {tab === 'not_started' && (training ? (
                    <DataGrid {...baseGridProps} columns={notStartedColumns} rows={notStarted.rows}
                              loading={notStarted.loading} pageSizeOptions={[20, 50, 100]}
                              initialState={{pagination: {paginationModel: {pageSize: 20}}}}/>
                ) : (
                    <Box sx={{...panelSx, p: 4, textAlign: 'center'}}>
                        <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                            Videoya hələ baxmamış əməkdaşları görmək üçün yuxarıdan təlim seçin.
                        </Typography>
                    </Box>
                ))}
            </Box>

            <QuizAttemptDialog attemptId={attemptId} onClose={() => setAttemptId(null)}/>
        </Box>
    );
}
