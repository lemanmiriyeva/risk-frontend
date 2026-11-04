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
    ACTIVITY_TEXT, DEPT_STATUS_META, PRIORITY_META, STATUS_META,
    formatDateTime, formatSize, timeAgo, validateFiles,
} from "./ticketMeta";

function SideSection({title, action, children}) {
    return (
        <Box sx={{py: 2, borderBottom: `1px solid ${C.line}`, '&:last-child': {borderBottom: 'none'}}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600}}>
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
                        title="İcraçı"
                        action={null}
                    >
                        {perms.can_set_assignee ? (
                            <TextField select size="small" fullWidth value={ticket.assignee || ''} disabled={busy}
                                       onChange={(e) => act(() => service_api.post(NEXT_API_ENDPOINTS.TICKETS.ASSIGNEE(id), {assignee: e.target.value || null}), 'İcraçı yeniləndi.')}>
                                <MenuItem value="">— Təyin olunmayıb —</MenuItem>
                                {ticket.assignee && !assigneeOptions.some((u) => u.id === ticket.assignee) && (
                                    <MenuItem value={ticket.assignee}>{ticket.assignee_name}</MenuItem>
                                )}
                                {assigneeOptions.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}{u.department_title ? ` · ${u.department_title}` : ''}</MenuItem>)}
                            </TextField>
                        ) : (
                            <Typography sx={{fontSize: 14}}>{ticket.assignee_name || 'Hələ təyin olunmayıb'}</Typography>
                        )}
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
                                        <Typography sx={{fontSize: 12, color: m.fg}}>{m.label}</Typography>
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
                        <Box>
                                <Typography sx={{fontSize: 14}}>{ticket.requester_name}</Typography>
                                <Typography sx={{fontSize: 12, color: C.inkFaint}}>{ticket.requester_department}</Typography>
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
