"use client"
import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const C = {
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    line: '#E4E1D8',
    gold: '#9C7A2E',
};

const STATUS_META = {
    pending: {label: 'Gözləmədə (Şöbə müdiri)', fg: '#8A7A2E', bg: 'rgba(138,122,46,0.1)'},
    awaiting_apparatus: {label: 'Aparat rəhbərini gözləyir', fg: '#8A5A2E', bg: 'rgba(138,90,46,0.1)'},
    approved: {label: 'Təsdiqlənib', fg: '#2F6B4F', bg: 'rgba(47,107,79,0.1)'},
    rejected: {label: 'Rədd edilib', fg: '#A23B3B', bg: 'rgba(162,59,59,0.1)'},
};

// Bir sətir üçün "Label / Value" formatı - detail modalın əsas tikinti bloku
function InfoRow({label, value, children}) {
    return (
        <Box sx={{display: 'flex', py: 1.1, borderBottom: `1px solid ${C.line}`, gap: 2}}>
            <Typography sx={{fontSize: 12.5, color: C.inkFaint, width: 160, flexShrink: 0, pt: 0.2}}>
                {label}
            </Typography>
            <Box sx={{flex: 1, minWidth: 0}}>
                {children ?? (
                    <Typography sx={{fontSize: 13.5, color: C.ink, wordBreak: 'break-word'}}>
                        {value || '—'}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

function ReviewStageCard({title, byName, at, comment, decided, decisionLabel}) {
    if (!decided) {
        return (
            <Box sx={{p: 1.5, border: `1px dashed ${C.line}`, borderRadius: '6px', mb: 1.5}}>
                <Typography sx={{fontSize: 12, color: C.inkFaint, fontWeight: 500}}>{title}</Typography>
                <Typography sx={{fontSize: 12.5, color: C.inkFaint, mt: 0.5}}>Hələ baxılmayıb</Typography>
            </Box>
        );
    }
    return (
        <Box sx={{p: 1.5, border: `1px solid ${C.line}`, borderRadius: '6px', mb: 1.5, backgroundColor: '#FBFAF6'}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography sx={{fontSize: 12, color: C.inkFaint, fontWeight: 500}}>{title}</Typography>
                {decisionLabel}
            </Box>
            <Typography sx={{fontSize: 13.5, color: C.ink, mt: 0.5}}>{byName || '—'}</Typography>
            {at && (
                <Typography sx={{fontSize: 12, color: C.inkFaint, mt: 0.25}}>{at}</Typography>
            )}
            {comment && (
                <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.75, fontStyle: 'italic'}}>
                    “{comment}”
                </Typography>
            )}
        </Box>
    );
}

export default function AttendancePermissionDetailDialog({open, target, onClose}) {
    if (!target) return null;

    const statusMeta = STATUS_META[target.status] || STATUS_META.pending;

    const deptDecided = !!(target.department_reviewed_by_name || target.department_reviewed_at || target.status !== 'pending');
    const deptRejected = target.status === 'rejected' && !target.reviewed_by_name;

    const apparatusDecided = target.status === 'approved' || target.status === 'rejected';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1.5}}>
                <Box>
                    <Typography sx={{fontSize: 16, fontWeight: 600, color: C.ink}}>
                        İcazə sorğusu təfərrüatları
                    </Typography>
                    <Typography sx={{fontSize: 12.5, color: C.inkFaint, mt: 0.3}}>
                        #{target.id}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{pt: 2}}>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1}}>
                    <Typography sx={{fontSize: 13, color: C.inkMuted}}>Status</Typography>
                    <Chip
                        label={statusMeta.label}
                        size="small"
                        sx={{backgroundColor: statusMeta.bg, color: statusMeta.fg, fontWeight: 500}}
                    />
                </Box>

                <Box sx={{mt: 1}}>
                    <InfoRow label="Tarix" value={target.date}/>
                    <InfoRow
                        label="Saat"
                        value={`${target.start_time?.slice(0, 5) || '—'}–${target.end_time?.slice(0, 5) || '—'}`}
                    />
                    <InfoRow label="Yer" value={target.location}/>
                    {target.user_name && <InfoRow label="İstifadəçi" value={target.user_name}/>}
                    {target.department_name && <InfoRow label="Departament" value={target.department_name}/>}
                    <InfoRow label="Səbəb" value={target.reason}/>
                    {target.created_at && <InfoRow label="Göndərilmə tarixi" value={target.created_at}/>}
                </Box>

                <Divider sx={{my: 2}}/>

                <Typography sx={{fontSize: 12.5, color: C.inkFaint, fontWeight: 500, mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em'}}>
                    Təsdiq mərhələləri
                </Typography>

                <ReviewStageCard
                    title="1. Şöbə müdiri"
                    byName={target.department_reviewed_by_name}
                    at={target.department_reviewed_at}
                    comment={target.department_comment}
                    decided={deptDecided}
                    decisionLabel={
                        target.status === 'pending' ? null : (
                            <Chip
                                size="small"
                                label={deptRejected ? 'Rədd edildi' : 'Təsdiqləndi'}
                                sx={{
                                    height: 20, fontSize: 11,
                                    backgroundColor: deptRejected ? 'rgba(162,59,59,0.1)' : 'rgba(47,107,79,0.1)',
                                    color: deptRejected ? '#A23B3B' : '#2F6B4F',
                                }}
                            />
                        )
                    }
                />

                <ReviewStageCard
                    title="2. Aparat rəhbəri"
                    byName={target.reviewed_by_name}
                    at={target.reviewed_at}
                    comment={target.comment}
                    decided={apparatusDecided}
                    decisionLabel={
                        <Chip
                            size="small"
                            label={target.status === 'rejected' ? 'Rədd edildi' : 'Təsdiqləndi'}
                            sx={{
                                height: 20, fontSize: 11,
                                backgroundColor: target.status === 'rejected' ? 'rgba(162,59,59,0.1)' : 'rgba(47,107,79,0.1)',
                                color: target.status === 'rejected' ? '#A23B3B' : '#2F6B4F',
                            }}
                        />
                    }
                />
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2}}>
                <Button
                    onClick={onClose}
                    sx={{textTransform: 'none', color: C.inkMuted}}
                >
                    Bağla
                </Button>
            </DialogActions>
        </Dialog>
    );
}