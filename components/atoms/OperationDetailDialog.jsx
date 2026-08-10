"use client"
import React from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const C = {
    surface: '#FFFFFF',
    surfaceRaised: '#FBFAF6',
    line: '#E4E1D8',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    inkFaint: '#948D7C',
    gold: '#9C7A2E',
};

const STEP_ICON = {
    approved: <CheckCircleOutlineIcon sx={{fontSize: 20, color: '#2F6B4F'}}/>,
    rejected: <HighlightOffIcon sx={{fontSize: 20, color: '#A23B3B'}}/>,
    pending: <HourglassEmptyIcon sx={{fontSize: 20, color: '#8A7A2E'}}/>,
    skipped: <HourglassEmptyIcon sx={{fontSize: 20, color: C.inkFaint}}/>,
};

function formatDateTime(v) {
    if (!v) return null;
    try {
        return new Date(v).toLocaleString('az-AZ');
    } catch {
        return v;
    }
}

export default function OperationDetailDialog({row, onClose}) {
    if (!row) return null;

    const steps = row.approval_steps || [];
    const isApproval = row.operation_type === 'approval';

    return (
        <Dialog
            open onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{sx: {backgroundColor: C.surface, backgroundImage: 'none', border: `1px solid ${C.line}`, borderRadius: '10px'}}}
        >
            <Box sx={{px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${C.line}`}}>
                <Box>
                    <Typography sx={{fontSize: 11, letterSpacing: '0.08em', color: C.gold, textTransform: 'uppercase', mb: 0.5}}>
                        {row.category_title || row.category_code || 'Ümumi'}
                    </Typography>
                    <Typography sx={{fontSize: 18, color: C.ink, fontWeight: 600, lineHeight: 1.3}}>
                        {row.object_repr || row.description || '—'}
                    </Typography>
                    <Typography sx={{fontSize: 13, color: C.inkMuted, mt: 0.5}}>
                        {row.description}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small"/></IconButton>
            </Box>

            <Box sx={{px: 3, py: 2.5}}>
                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2}}>
                    <Chip size="small" label={row.action_display} sx={{backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`}}/>
                    <Chip size="small" label={row.status_display} sx={{backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`}}/>
                    <Chip size="small" label={row.user_name || row.user_username_snapshot || 'Naməlum'} sx={{backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`}}/>
                </Box>

                {isApproval && steps.length > 0 && (
                    <Box sx={{mb: 2}}>
                        <Typography sx={{fontSize: 12, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5}}>
                            Təsdiq mərhələləri
                        </Typography>
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                            {steps.map((step) => (
                                <Box key={step.id} sx={{display: 'flex', gap: 1.5, alignItems: 'flex-start'}}>
                                    <Box sx={{mt: 0.25}}>{STEP_ICON[step.status] || STEP_ICON.pending}</Box>
                                    <Box sx={{flex: 1}}>
                                        <Typography sx={{fontSize: 13.5, color: C.ink, fontWeight: 500}}>
                                            {step.step_number}. {step.role_label || 'Mərhələ'} — {step.status_display}
                                        </Typography>
                                        {(step.reviewed_by_name || step.reviewed_at) && (
                                            <Typography sx={{fontSize: 12, color: C.inkMuted}}>
                                                {step.reviewed_by_name || '—'}{step.reviewed_at ? ` · ${formatDateTime(step.reviewed_at)}` : ''}
                                            </Typography>
                                        )}
                                        {step.comment && (
                                            <Typography sx={{fontSize: 12.5, color: C.inkMuted, fontStyle: 'italic', mt: 0.25}}>
                                                “{step.comment}”
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}

                {row.changes && (
                    <Box>
                        <Typography sx={{fontSize: 12, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1}}>
                            Dəyişikliklər
                        </Typography>
                        <Box sx={{backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`, borderRadius: '6px', p: 1.5, fontSize: 12.5, fontFamily: 'monospace', color: C.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                            {JSON.stringify(row.changes, null, 2)}
                        </Box>
                    </Box>
                )}

                <Typography sx={{fontSize: 11.5, color: C.inkFaint, mt: 2}}>
                    Yaradıldı: {formatDateTime(row.created_at)}
                </Typography>
            </Box>
        </Dialog>
    );
}