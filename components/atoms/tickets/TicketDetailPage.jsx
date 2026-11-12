"use client"
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Rating from '@mui/material/Rating';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {useSnackbar} from "notistack";
import {useRouter} from 'next/navigation';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV, C} from "@/components/theme/tokens";
import TicketDepartmentsDialog from "./TicketDepartmentsDialog";
import {PriorityChip, SlaBadge, StatusChip} from "./TicketBadges";
import {
    ACTIVITY_TEXT, ASSIGNEE_STATUS_META, DEPT_STATUS_META, PRIORITY_META, STATUS_META,
    formatDateTime, formatSize, timeAgo, validateFiles,
} from "./ticketMeta";

function SideSection({title, action, children}) {
    return (
        <Box sx={{py: 2, borderBottom: `1px solid ${C.line}`, '&:last-child': {borderBottom: 'none'}}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700}}>
                    {title}
                </Typography>
                {action}
            </Box>
            {children}
        </Box>
    );
}

function AttachmentList({items}) {
    if (!items?.length) return null;
    return (
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
            {items.map((a) => (
                <Chip
                    key={a.id} component="a" clickable href={a.url} target="_blank" rel="noopener noreferrer"
                    icon={<InsertDriveFileOutlinedIcon/>} size="small" variant="outlined"
                    label={`${a.original_name} · ${formatSize(a.size)}`}
                    sx={{maxWidth: 320, backgroundColor: C.surface}}
                />
            ))}
        </Box>
    );
}

function TimelineItem({entry}) {
    if (entry.kind === 'comment') {
        const c = entry.data;
        return (
            <Box sx={{mb: 2}}>
                <Box sx={{
                    minWidth: 0, p: 1.75, borderRadius: '4px',
                    backgroundColor: c.is_internal ? 'rgba(201,154,30,0.10)' : C.surface,
                    border: `1px solid ${c.is_internal ? 'rgba(201,154,30,0.45)' : C.line}`,
                }}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5}}>
                        <Typography sx={{fontSize: 13.5, fontWeight: 600}}>{c.author_name}</Typography>
                        {c.author_department && <Typography sx={{fontSize: 12, color: C.inkFaint}}>{c.author_department}</Typography>}
                        {c.is_requester && <Chip size="small" label="Müraciətçi" sx={{height: 18, fontSize: 10.5}}/>}
                        {c.is_internal && <Chip size="small" icon={<LockOutlinedIcon sx={{fontSize: '12px !important'}}/>} label="Daxili qeyd"
                                                sx={{height: 18, fontSize: 10.5, backgroundColor: 'rgba(201,154,30,0.25)'}}/>}
                        <Tooltip title={formatDateTime(c.created_at)}>
                            <Typography sx={{fontSize: 12, color: C.inkFaint, ml: 'auto'}}>{timeAgo(c.created_at)}</Typography>
                        </Tooltip>
                    </Box>
                    <Typography sx={{fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: C.ink}}>{c.body}</Typography>
                    <AttachmentList items={c.attachments}/>
                </Box>
            </Box>
        );
    }
    const a = entry.data;
    const text = (ACTIVITY_TEXT[a.action] || (() => a.action))(a.data || {});
    return (
        <Box sx={{display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center'}}>
            <Typography sx={{fontSize: 13, color: C.inkMuted}}>
                <b style={{color: C.ink}}>{a.actor_name}</b> {text}
                <Tooltip title={formatDateTime(a.created_at)}><span style={{color: C.inkFaint}}> · {timeAgo(a.created_at)}</span></Tooltip>
            </Typography>
        </Box>
    );
}

export default function TicketDetailPage({id}) {
    const {enqueueSnackbar} = useSnackbar();
    const router = useRouter();
    const [ticket, setTicket] = useState(null);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [busy, setBusy] = useState(false);

    const [feedTab, setFeedTab] = useState('all');
    const [body, setBody] = useState('');
    const [internal, setInternal] = useState(false);
    const [files, setFiles] = useState([]);
    const fileRef = useRef(null);

    const [statusDlg, setStatusDlg] = useState(null);       // {value, label}
    const [statusComment, setStatusComment] = useState('');
    const [deptDlg, setDeptDlg] = useState(false);
    const [addDlg, setAddDlg] = useState(false);
    const [addSel, setAddSel] = useState([]);
    const [editDlg, setEditDlg] = useState(false);
    const [editForm, setEditForm] = useState({title: '', description: ''});
    const [assigneeOptions, setAssigneeOptions] = useState([]);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingComment, setRatingComment] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.TICKETS.DETAIL(id));
            setTicket(res.data);
            setNotFound(false);
        } catch (e) {
            if (e?.response?.status === 404 || e?.status === 404) setNotFound(true);
            else enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [id, enqueueSnackbar]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        service_api.get(NEXT_API_ENDPOINTS.TICKETS.META).then((r) => setMeta(r.data)).catch(() => {});
    }, []);

    // cavabdeh icraçı seçimi: təyin olunmuş şöbələrin əməkdaşları
    const deptKey = (ticket?.department_links || []).map((l) => l.department).join(',');
    useEffect(() => {
        if (!ticket?.permissions?.can_set_assignee || !deptKey) {setAssigneeOptions([]); return;}
        let alive = true;
        Promise.all(deptKey.split(',').map((d) =>
            service_api.get(`${NEXT_API_ENDPOINTS.TICKETS.USERS}?department=${d}`).then((r) => r.data).catch(() => [])))
            .then((lists) => {
                if (!alive) return;
                const map = new Map();
                lists.flat().forEach((u) => map.set(u.id, u));
                setAssigneeOptions(Array.from(map.values()));
            });
        return () => {alive = false;};
    }, [deptKey, ticket?.permissions?.can_set_assignee]);

    async function act(fn, okMsg) {
        setBusy(true);
        try {
            const res = await fn();
            if (res?.data?.id === ticket?.id && res.data.permissions) setTicket(res.data);
            else await load(true);
            if (okMsg) enqueueSnackbar(okMsg, {variant: 'success'});
            return true;
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            return false;
        } finally {
            setBusy(false);
        }
    }

    const perms = ticket?.permissions;

    const feed = useMemo(() => {
        if (!ticket) return [];
        const comments = (ticket.comments || []).map((c) => ({kind: 'comment', at: c.created_at, key: `c${c.id}`, data: c}));
        const acts = (ticket.activities || []).filter((a) => a.action !== 'commented')
            .map((a) => ({kind: 'activity', at: a.created_at, key: `a${a.id}`, data: a}));
        let list = feedTab === 'comments' ? comments : feedTab === 'history' ? acts : [...comments, ...acts];
        return list.sort((x, y) => new Date(x.at) - new Date(y.at));
    }, [ticket, feedTab]);

    function addFiles(e) {
        const picked = Array.from(e.target.files || []);
        e.target.value = '';
        const err = validateFiles(picked);
        if (err) {enqueueSnackbar(err, {variant: 'warning'}); return;}
        setFiles((p) => [...p, ...picked].slice(0, 10));
    }

    async function sendComment() {
        if (!body.trim()) return;
        setBusy(true);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.TICKETS.COMMENTS(id), {body: body.trim(), is_internal: internal});
            if (files.length) {
                try {
                    const fd = new FormData();
                    files.forEach((f) => fd.append('files', f));
                    fd.append('comment', res.data.id);
                    await service_api.post(NEXT_API_ENDPOINTS.TICKETS.ATTACHMENTS(id), fd, {headers: {'Content-Type': 'multipart/form-data'}});
                } catch (e) {
                    enqueueSnackbar(`Şərh göndərildi, fayllar yüklənmədi: ${handleError(e)}`, {variant: 'warning'});
                }
            }
            setBody(''); setFiles([]); setInternal(false);
            await load(true);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setBusy(false);
        }
    }

    async function submitStatus() {
        const ok = await act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.STATUS(id),
            {status: statusDlg.value, comment: statusComment.trim()}), `Status: ${statusDlg.label}`);
        if (ok) {setStatusDlg(null); setStatusComment('');}
    }

    async function saveEdit() {
        const ok = await act(() => service_api.patch(NEXT_API_ENDPOINTS.TICKETS.DETAIL(id),
            {title: editForm.title.trim(), description: editForm.description.trim()}), 'Müraciət yeniləndi.');
        if (ok) setEditDlg(false);
    }

    if (loading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', py: 12}}><CircularProgress/></Box>;
    }
    if (notFound || !ticket) {
        return (
            <Box sx={{maxWidth: 560, mx: 'auto', py: 12, textAlign: 'center'}}>
                <Typography sx={{fontSize: 20, fontWeight: 600, mb: 1}}>Müraciət tapılmadı</Typography>
                <Typography sx={{color: C.inkMuted, mb: 3}}>Müraciət mövcud deyil və ya ona baxmaq icazəniz yoxdur.</Typography>
                <Button component={Link} href="/muracietler" variant="contained">Müraciətlərə qayıt</Button>
            </Box>
        );
    }

    const active = !['closed', 'canceled'].includes(ticket.status);
    const primaryTransition = (perms.transitions || []).find((t) => ['resolved', 'closed'].includes(t.value));
    const reopenTransition = (perms.transitions || []).find((t) => t.value === 'in_progress' && ['resolved', 'closed'].includes(ticket.status));

    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh', pb: 8}}>
            <Box sx={{backgroundColor: C.surface, borderBottom: `1px solid ${C.line}`}}>
                <Box sx={{maxWidth: 1440, mx: 'auto', px: {xs: 2, sm: 4}, py: 2.5}}>
                    <Button size="small" startIcon={<ArrowBackIcon/>} component={Link} href="/muracietler" sx={{mb: 1.5, color: C.inkMuted}}>
                        Bütün müraciətlər
                    </Button>
                    <Box sx={{display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap'}}>
                        <Box sx={{flex: 1, minWidth: 260}}>
                            <Box sx={{display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 0.75}}>
                                <Typography sx={{fontSize: 13, fontWeight: 600, color: C.ink}}>{ticket.number}</Typography>
                                <StatusChip status={ticket.status} label={ticket.status_display}/>
                                <PriorityChip priority={ticket.priority} label={ticket.priority_display}/>
                                <Chip size="small" variant="outlined" label={ticket.type_display} sx={{height: 24}}/>
                                {ticket.category_title && (
                                    <Chip size="small" variant="outlined" label={ticket.category_title} sx={{height: 24}}/>
                                )}
                                {ticket.reopen_count > 0 && <Chip size="small" label={`Yenidən açılıb ×${ticket.reopen_count}`} sx={{height: 24}}/>}
                            </Box>
                            <Box sx={{display: 'flex', gap: 1, alignItems: 'flex-start'}}>
                                <Typography component="h1" sx={{fontSize: {xs: 20, sm: 24}, fontWeight: 650, color: C.ink, lineHeight: 1.3, wordBreak: 'break-word'}}>
                                    {ticket.title}
                                </Typography>
                                {perms.can_edit && (
                                    <Tooltip title="Mövzu və təsviri redaktə et">
                                        <IconButton size="small" onClick={() => {setEditForm({title: ticket.title, description: ticket.description}); setEditDlg(true);}}>
                                            <EditOutlinedIcon fontSize="small"/>
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                            <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.5}}>
                                {ticket.requester_name}{ticket.requester_department ? ` · ${ticket.requester_department}` : ''} · {formatDateTime(ticket.created_at)}
                            </Typography>
                        </Box>
                        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                            <Button
                                variant="outlined" size="small" disabled={busy}
                                startIcon={perms.is_watching ? <VisibilityOffOutlinedIcon/> : <VisibilityOutlinedIcon/>}
                                onClick={() => act(() => service_api.post(perms.is_watching ? NEXT_API_ENDPOINTS.TICKETS.UNWATCH(id) : NEXT_API_ENDPOINTS.TICKETS.WATCH(id)),
                                    perms.is_watching ? 'İzləmə dayandırıldı.' : 'Müraciəti izləyirsiniz.')}
                            >
                                {perms.is_watching ? 'İzləməyi burax' : 'İzlə'}
                            </Button>
                            {perms.can_take && (
                                <Button variant="outlined" size="small" startIcon={<PlayArrowIcon/>} disabled={busy}
                                        onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.TAKE(id)), 'Müraciəti öz üzərinizə götürdünüz.')}>
                                    Özümə götür
                                </Button>
                            )}
                            {reopenTransition && (
                                <Button variant="outlined" size="small" color="warning" disabled={busy}
                                        onClick={() => setStatusDlg({value: 'in_progress', label: 'Yenidən açıldı'})}>
                                    Yenidən aç
                                </Button>
                            )}
                            {primaryTransition && (
                                <Button variant="contained" size="small" color="success" disabled={busy}
                                        onClick={() => setStatusDlg({value: primaryTransition.value, label: primaryTransition.label})}>
                                    {primaryTransition.value === 'closed' ? 'Bağla' : 'Həll edildi'}
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{maxWidth: 1440, mx: 'auto', px: {xs: 2, sm: 4}, pt: 3, display: 'flex', gap: 3, flexWrap: {xs: 'wrap', lg: 'nowrap'}, alignItems: 'flex-start'}}>
                {/* ----------- əsas sütun ----------- */}
                <Box sx={{flex: 1, minWidth: 0, width: '100%'}}>
                    <Box sx={{p: 2.5, borderRadius: '4px', backgroundColor: C.surface, border: `1px solid ${C.line}`, mb: 3}}>
                        <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, mb: 1}}>Təsvir</Typography>
                        <Typography sx={{fontSize: 14.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6}}>{ticket.description}</Typography>
                        {ticket.tags?.length > 0 && (
                            <Box sx={{display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap'}}>
                                {ticket.tags.map((t) => <Chip key={t} size="small" label={`#${t}`} variant="outlined"/>)}
                            </Box>
                        )}
                        <AttachmentList items={(ticket.attachments || []).filter((a) => !a.comment)}/>
                    </Box>

                    {/* qiymətləndirmə */}
                    {perms.can_rate && (
                        <Box sx={{p: 2.5, borderRadius: '4px', backgroundColor: C.surface, border: `1px solid ${C.line}`, mb: 3}}>
                            <Typography sx={{fontWeight: 650, mb: 0.5}}>
                                {ticket.rating ? 'Sizin qiymətiniz' : 'Həlli necə qiymətləndirirsiniz?'}
                            </Typography>
                            <Box sx={{display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap'}}>
                                <Rating size="large" value={ticket.rating || ratingValue} readOnly={!!ticket.rating || busy}
                                        onChange={(_, v) => setRatingValue(v || 0)}/>
                                {!ticket.rating && (
                                    <>
                                        <TextField size="small" placeholder="Rəy (istəyə bağlı)" value={ratingComment}
                                                   onChange={(e) => setRatingComment(e.target.value)} sx={{minWidth: 240, flex: 1}}/>
                                        <Button variant="contained" size="small" disabled={!ratingValue || busy}
                                                onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.RATE(id), {rating: ratingValue, comment: ratingComment}), 'Təşəkkür edirik!')}>
                                            Göndər
                                        </Button>
                                    </>
                                )}
                                {ticket.rating && ticket.rating_comment && <Typography sx={{fontSize: 13, color: C.inkMuted}}>“{ticket.rating_comment}”</Typography>}
                            </Box>
                        </Box>
                    )}

                    {/* tarixçə / şərhlər */}
                    <Tabs value={feedTab} onChange={(_, v) => setFeedTab(v)} sx={{mb: 2, minHeight: 40, '& .MuiTab-root': {textTransform: 'none', fontWeight: 600, minHeight: 40}}}>
                        <Tab value="all" label="Hamısı"/>
                        <Tab value="comments" label={`Şərhlər (${(ticket.comments || []).length})`}/>
                        <Tab value="history" label="Tarixçə"/>
                    </Tabs>
                    <Box sx={{mb: 3}}>
                        {feed.map((e) => <TimelineItem key={e.key} entry={e}/>)}
                        {!feed.length && <Typography sx={{color: C.inkFaint, fontSize: 14}}>Hələ heç nə yoxdur.</Typography>}
                    </Box>

                    {/* şərh yazmaq */}
                    {perms.can_comment ? (
                        <Box sx={{p: 2, borderRadius: '4px', backgroundColor: internal ? 'rgba(201,154,30,0.10)' : C.surface,
                            border: `1px solid ${internal ? 'rgba(201,154,30,0.55)' : C.line}`}}>
                            <TextField
                                fullWidth multiline minRows={3} value={body} onChange={(e) => setBody(e.target.value)} disabled={busy}
                                placeholder={internal ? 'Daxili qeyd (müraciətçi görməyəcək)...' : 'Şərh yazın...'}
                                sx={{backgroundColor: C.surface, borderRadius: '4px'}}
                            />
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5, flexWrap: 'wrap'}}>
                                <input ref={fileRef} type="file" multiple hidden onChange={addFiles}/>
                                <Button size="small" startIcon={<AttachFileIcon/>} onClick={() => fileRef.current?.click()} disabled={busy}>Fayl</Button>
                                {perms.can_comment_internal && (
                                    <FormControlLabel
                                        control={<Checkbox size="small" checked={internal} onChange={(e) => setInternal(e.target.checked)}/>}
                                        label={<Typography sx={{fontSize: 13}}>Daxili qeyd</Typography>}
                                    />
                                )}
                                <Button variant="contained" size="small" sx={{ml: 'auto'}} disabled={busy || !body.trim()} onClick={sendComment}>
                                    {busy ? <CircularProgress size={16} sx={{color: '#fff'}}/> : 'Göndər'}
                                </Button>
                            </Box>
                            {files.length > 0 && (
                                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1}}>
                                    {files.map((f, i) => (
                                        <Chip key={i} size="small" label={`${f.name} · ${formatSize(f.size)}`} onDelete={() => setFiles((p) => p.filter((_, j) => j !== i))}/>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    ) : (
                        !active && <Typography sx={{fontSize: 13.5, color: C.inkFaint}}>Müraciət bağlanıb - şərh yazmaq üçün yenidən açın.</Typography>
                    )}
                </Box>

                {/* ----------- yan panel ----------- */}
                <Box sx={{width: {xs: '100%', lg: 340}, flexShrink: 0, px: 2.5, py: 0.5, borderRadius: '4px', backgroundColor: C.surface, border: `1px solid ${C.line}`}}>
                    <SideSection title="Status">
                        {(perms.transitions || []).length > 0 ? (
                            <TextField select size="small" fullWidth value={ticket.status} disabled={busy}
                                       onChange={(e) => {
                                           const t = perms.transitions.find((x) => x.value === e.target.value);
                                           if (t) setStatusDlg(t);
                                       }}>
                                <MenuItem value={ticket.status} disabled>{STATUS_META[ticket.status]?.label}</MenuItem>
                                {perms.transitions.map((t) => <MenuItem key={t.value} value={t.value}>→ {t.label}</MenuItem>)}
                            </TextField>
                        ) : <StatusChip status={ticket.status} label={ticket.status_display}/>}
                        <Box sx={{mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5}}>
                            <Box sx={{display: 'flex', justifyContent: 'space-between', fontSize: 13}}>
                                <span style={{color: C.inkMuted}}>İlk cavab</span>
                                <span style={{color: ticket.sla.first_response_overdue ? C.danger : C.ink, fontWeight: ticket.sla.first_response_overdue ? 700 : 400}}>
                                    {ticket.first_response_at ? formatDateTime(ticket.first_response_at) : `gözlənilir (${formatDateTime(ticket.sla.first_response_due_at)})`}
                                </span>
                            </Box>
                            <Box sx={{display: 'flex', justifyContent: 'space-between', fontSize: 13, alignItems: 'center'}}>
                                <span style={{color: C.inkMuted}}>Həll müddəti (SLA)</span>
                                {ticket.resolved_at ? <span>{formatDateTime(ticket.resolved_at)}</span> : <SlaBadge ticket={ticket}/>}
                            </Box>
                            {!ticket.resolved_at && ticket.due_at && <Typography sx={{fontSize: 12, color: C.inkFaint, textAlign: 'right'}}>{formatDateTime(ticket.due_at)}</Typography>}
                        </Box>
                    </SideSection>

                    <SideSection title="Detallar">
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.25}}>
                            {perms.can_edit ? (
                                <>
                                    <TextField select size="small" label="Prioritet" value={ticket.priority} disabled={busy}
                                               onChange={(e) => act(() => service_api.patch(NEXT_API_ENDPOINTS.TICKETS.DETAIL(id), {priority: e.target.value}), 'Prioritet dəyişdi (SLA yenidən hesablandı).')}>
                                        {Object.entries(PRIORITY_META).map(([v, m]) => <MenuItem key={v} value={v}>{m.label}</MenuItem>)}
                                    </TextField>
                                    <TextField select size="small" label="Kateqoriya" value={ticket.category || ''} disabled={busy}
                                               onChange={(e) => act(() => service_api.patch(NEXT_API_ENDPOINTS.TICKETS.DETAIL(id), {category: e.target.value || null}))}>
                                        <MenuItem value="">— Seçilməyib —</MenuItem>
                                        {(meta?.categories || []).map((c) => <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>)}
                                    </TextField>
                                    <TextField select size="small" label="Növ" value={ticket.ticket_type} disabled={busy}
                                               onChange={(e) => act(() => service_api.patch(NEXT_API_ENDPOINTS.TICKETS.DETAIL(id), {ticket_type: e.target.value}))}>
                                        {(meta?.types || []).map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                                    </TextField>
                                </>
                            ) : (
                                <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                                    {ticket.type_display}{ticket.category_title ? ` · ${ticket.category_title}` : ''}
                                </Typography>
                            )}
                            {ticket.organization_name && <Typography sx={{fontSize: 12.5, color: C.inkFaint}}>Qurum: {ticket.organization_name}</Typography>}
                        </Box>
                    </SideSection>

                    <SideSection
                        title={`İcraçılar (${(ticket.assignees || []).length})`}
                        action={perms.can_set_assignee && (
                            <Button size="small" onClick={() => {setAddSel([]); setAddDlg(true);}} sx={{minWidth: 0, fontSize: 12}}>Əlavə et</Button>
                        )}
                    >
                        {(ticket.assignees || []).length === 0 && (
                            <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                                {perms.can_take
                                    ? 'Hələ heç kim götürməyib. Müraciəti özünüz götürə bilərsiniz.'
                                    : 'Hələ icraçı yoxdur. Təyin olunmuş şöbənin əməkdaşları müraciəti özlərinə götürə bilər.'}
                            </Typography>
                        )}
                        {(ticket.assignees || []).map((a) => {
                            const mine = a.user === perms.user_id;
                            const st = ASSIGNEE_STATUS_META[a.status] || ASSIGNEE_STATUS_META.assigned;
                            const editable = perms.can_set_my_status;
                            return (
                                <Box key={a.id} sx={{p: 1.25, mb: 1, borderRadius: '4px', border: `1px solid ${C.line}`}}>
                                    <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 1}}>
                                        <Box sx={{minWidth: 0}}>
                                            <Typography sx={{fontSize: 13.5, fontWeight: 600}}>{a.name}{mine ? ' (siz)' : ''}</Typography>
                                            {a.department_title && <Typography sx={{fontSize: 12, color: C.inkFaint}}>{a.department_title}</Typography>}
                                        </Box>
                                        <Typography sx={{fontSize: 12.5, color: st.fg, whiteSpace: 'nowrap'}}>{a.status_display}</Typography>
                                    </Box>
                                    {mine && editable && (
                                        <Box sx={{display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap'}}>
                                            {a.status === 'assigned' && (
                                                <Button size="small" variant="contained" disabled={busy}
                                                        onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.ASSIGNEE_STATUS(id), {status: 'in_progress'}), 'İcraya başladınız.')}>
                                                    İşə başla
                                                </Button>
                                            )}
                                            {a.status === 'in_progress' && (
                                                <Button size="small" variant="contained" color="success" disabled={busy}
                                                        onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.ASSIGNEE_STATUS(id), {status: 'done'}), 'Hissənizi tamamladınız.')}>
                                                    Tamamladım
                                                </Button>
                                            )}
                                            {a.status === 'done' && (
                                                <Button size="small" variant="outlined" disabled={busy}
                                                        onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.ASSIGNEE_STATUS(id), {status: 'in_progress'}), 'Yenidən icradasınız.')}>
                                                    Yenidən işə al
                                                </Button>
                                            )}
                                            <Button size="small" variant="outlined" color="inherit" disabled={busy}
                                                    onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.RELEASE(id), {}), 'Müraciətdən çıxdınız.')}>
                                                Çıx
                                            </Button>
                                        </Box>
                                    )}
                                    {!mine && perms.can_set_assignee && ticket.status !== 'resolved' && (
                                        <Box sx={{mt: 1}}>
                                            <Button size="small" variant="outlined" color="inherit" disabled={busy}
                                                    onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.RELEASE(id), {user: a.user}), 'İcraçı çıxarıldı.')}>
                                                Çıxar
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </SideSection>

                    <SideSection
                        title={`Məsul şöbələr (${ticket.department_links.length})`}
                        action={perms.can_assign && <Button size="small" onClick={() => setDeptDlg(true)} sx={{minWidth: 0, fontSize: 12}}>Dəyiş</Button>}
                    >
                        {ticket.department_links.map((l) => {
                            const m = DEPT_STATUS_META[l.status];
                            const canChange = active && ticket.status !== 'resolved' && perms.is_agent;
                            return (
                                <Box key={l.id} sx={{p: 1.25, mb: 1, borderRadius: '4px', border: `1px solid ${C.line}`}}>
                                    <Box sx={{display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'center'}}>
                                        <Typography sx={{fontSize: 13.5, fontWeight: 600}}>{l.department_title}{l.is_primary ? ' (əsas)' : ''}</Typography>
                                        <Chip size="small" label={m.label} sx={{height: 20, fontSize: 11, backgroundColor: m.bg, color: m.fg, fontWeight: 600}}/>
                                    </Box>
                                    <Typography sx={{fontSize: 12, color: C.inkFaint}}>
                                        {l.assignee_name ? `İcraçı: ${l.assignee_name}` : (l.manager_name ? `Rəhbər: ${l.manager_name}` : 'İcraçı yoxdur')}
                                    </Typography>
                                    {l.note && <Typography sx={{fontSize: 12, color: C.inkMuted, fontStyle: 'italic', mt: 0.25}}>{l.note}</Typography>}
                                    {canChange && (
                                        <Box sx={{display: 'flex', gap: 0.75, mt: 1}}>
                                            {l.status !== 'in_progress' && l.status !== 'done' && (
                                                <Button size="small" variant="outlined" disabled={busy} sx={{fontSize: 11.5, py: 0}}
                                                        onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.DEPARTMENT_STATUS(id), {department: l.department, status: 'in_progress'}))}>
                                                    İcraya başla
                                                </Button>
                                            )}
                                            {l.status !== 'done' ? (
                                                <Button size="small" variant="outlined" color="success" disabled={busy} sx={{fontSize: 11.5, py: 0}}
                                                        onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.DEPARTMENT_STATUS(id), {department: l.department, status: 'done'}), `${l.department_title}: tamamlandı`)}>
                                                    Tamamlandı
                                                </Button>
                                            ) : (
                                                <Button size="small" variant="text" disabled={busy} sx={{fontSize: 11.5, py: 0}}
                                                        onClick={() => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.DEPARTMENT_STATUS(id), {department: l.department, status: 'in_progress'}))}>
                                                    Geri qaytar
                                                </Button>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                        {!ticket.department_links.length && (
                            <Typography sx={{fontSize: 13, color: C.warning}}>Şöbə təyin olunmayıb — admin baxışı gözləyir.</Typography>
                        )}
                    </SideSection>

                    <SideSection title="Müraciətçi">
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                            <Box>
                                <Typography sx={{fontSize: 14}}>{ticket.requester_name}</Typography>
                                <Typography sx={{fontSize: 12, color: C.inkFaint}}>{ticket.requester_department}</Typography>
                            </Box>
                        </Box>
                    </SideSection>

                    <SideSection title={`İzləyənlər (${ticket.watchers.length})`}>
                        <Box sx={{display: 'flex', gap: 0.75, flexWrap: 'wrap'}}>
                            {ticket.watchers.map((w) => <Chip key={w.id} size="small" variant="outlined" label={w.name}/>)}
                        </Box>
                    </SideSection>
                </Box>
            </Box>

            {/* status dəyişmə təsdiqi */}
            <Dialog open={!!statusDlg} onClose={() => !busy && setStatusDlg(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{fontWeight: 600}}>Status: {statusDlg?.label}</DialogTitle>
                <DialogContent>
                    <Typography sx={{fontSize: 13.5, color: C.inkMuted, mb: 2}}>
                        {['resolved'].includes(statusDlg?.value) && 'Müraciətçiyə həllin nəticəsini qısa izah edin - o, qiymət verə və ya yenidən aça biləcək.'}
                        {statusDlg?.value === 'waiting' && 'Müraciətçidən nə lazım olduğunu yazın.'}
                        {statusDlg?.value === 'canceled' && 'Ləğv etmə səbəbini yazın.'}
                        {statusDlg?.value === 'in_progress' && ['resolved', 'closed'].includes(ticket.status) && 'Problem həll olunmayıbsa nə baş verdiyini yazın.'}
                    </Typography>
                    <TextField fullWidth multiline minRows={3} label="Şərh (istəyə bağlı)" value={statusComment}
                               onChange={(e) => setStatusComment(e.target.value)} disabled={busy}/>
                </DialogContent>
                <DialogActions sx={{px: 3, py: 2}}>
                    <Button onClick={() => setStatusDlg(null)} disabled={busy}>İmtina</Button>
                    <Button variant="contained" onClick={submitStatus} disabled={busy}>
                        {busy ? <CircularProgress size={18} sx={{color: '#fff'}}/> : 'Təsdiq et'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={editDlg} onClose={() => !busy && setEditDlg(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{fontWeight: 600}}>Müraciəti redaktə et</DialogTitle>
                <DialogContent dividers>
                    <TextField fullWidth size="small" label="Mövzu" value={editForm.title} sx={{mb: 2, mt: 0.5}}
                               onChange={(e) => setEditForm((f) => ({...f, title: e.target.value}))} inputProps={{maxLength: 200}}/>
                    <TextField fullWidth multiline minRows={5} label="Təsvir" value={editForm.description}
                               onChange={(e) => setEditForm((f) => ({...f, description: e.target.value}))}/>
                </DialogContent>
                <DialogActions sx={{px: 3, py: 2}}>
                    <Button onClick={() => setEditDlg(false)} disabled={busy}>İmtina</Button>
                    <Button variant="contained" onClick={saveEdit}
                            disabled={busy || editForm.title.trim().length < 5 || editForm.description.trim().length < 10}>Yadda saxla</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={addDlg} onClose={() => !busy && setAddDlg(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{fontWeight: 600}}>İcraçı əlavə et</DialogTitle>
                <DialogContent>
                    <Typography sx={{fontSize: 13, color: C.inkMuted, mb: 2}}>
                        Təyin olunmuş şöbələrin əməkdaşlarından bir və ya bir neçəsini seçin. Seçilənlər bildiriş alacaq.
                    </Typography>
                    <TextField select fullWidth size="small" label="Əməkdaşlar" value={addSel}
                               SelectProps={{multiple: true, renderValue: (v) => assigneeOptions.filter((u) => v.includes(u.id)).map((u) => u.name).join(', ')}}
                               onChange={(e) => setAddSel(e.target.value)}>
                        {assigneeOptions.filter((u) => !(ticket.assignees || []).some((a) => a.user === u.id)).map((u) => (
                            <MenuItem key={u.id} value={u.id}>{u.name}{u.department_title ? ` · ${u.department_title}` : ''}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={() => setAddDlg(false)} disabled={busy}>Ləğv et</Button>
                    <Button variant="contained" disabled={busy || !addSel.length}
                            onClick={async () => {
                                const ok = await act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.ASSIGNEES(id), {users: addSel}), 'İcraçılar əlavə edildi.');
                                if (ok) setAddDlg(false);
                            }}>
                        Əlavə et
                    </Button>
                </DialogActions>
            </Dialog>

            <TicketDepartmentsDialog
                open={deptDlg} onClose={() => setDeptDlg(false)} ticket={ticket} departments={meta?.departments || []} saving={busy}
                onSave={async (items) => {
                    const ok = await act(() => service_api.put(NEXT_API_ENDPOINTS.TICKETS.DEPARTMENTS(id), {departments: items}), 'Şöbə təyinatı yeniləndi.');
                    if (ok) setDeptDlg(false);
                }}
            />
        </Box>
    );
}