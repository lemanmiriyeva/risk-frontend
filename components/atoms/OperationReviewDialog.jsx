"use client"
import React, {useEffect, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

const C = {
    surface: '#FFFFFF',
    line: '#E4E1D8',
    ink: '#1D1B16',
    inkMuted: '#6B6558',
    approve: '#2F6B4F',
    reject: '#A23B3B',
};

/**
 * target: seçilmiş Operation sətri
 * action: 'approve' | 'reject' | null (dialog bağlı olduqda null)
 */
export default function OperationReviewDialog({target, action, onClose, onConfirm, loading}) {
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (target) setComment('');
    }, [target, action]);

    if (!target || !action) return null;

    const isApprove = action === 'approve';
    const currentStep = (target.approval_steps || []).find((s) => s.step_number === target.current_step);
    const isLastStep = target.current_step >= (target.total_steps || target.current_step);

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth
                PaperProps={{sx: {backgroundColor: C.surface, borderRadius: '14px', border: `1px solid ${C.line}`}}}>
            <Box sx={{px: 3, pt: 3, pb: 1}}>
                <Typography sx={{fontSize: 18, fontWeight: 600, color: C.ink, mb: 1}}>
                    {isApprove ? 'Əməliyyat təsdiqlənsin?' : 'Əməliyyat rədd edilsin?'}
                </Typography>
                <Typography sx={{fontSize: 13.5, color: C.inkMuted}}>
                    <b>{target.category_title}</b> — {target.object_repr || target.description}
                </Typography>
                {currentStep?.role_label && (
                    <Typography sx={{fontSize: 12, color: C.inkMuted, mt: 0.5}}>
                        Mərhələ {target.current_step}{target.total_steps ? `/${target.total_steps}` : ''} — {currentStep.role_label}
                    </Typography>
                )}
                {isApprove && !isLastStep && (
                    <Typography sx={{fontSize: 12, color: C.inkMuted, mt: 0.5, fontStyle: 'italic'}}>
                        Təsdiqlədikdən sonra sorğu növbəti mərhələyə göndəriləcək.
                    </Typography>
                )}
                {isApprove && isLastStep && (
                    <Typography sx={{fontSize: 12, color: C.inkMuted, mt: 0.5, fontStyle: 'italic'}}>
                        Bu son mərhələdir - təsdiqdən sonra əməliyyat tamamilə bağlanacaq.
                    </Typography>
                )}
            </Box>
            <Box sx={{px: 3, pb: 1}}>
                <TextField
                    fullWidth multiline minRows={2} size="small"
                    label={isApprove ? 'Qeyd (istəyə bağlı)' : 'Rədd səbəbi (istəyə bağlı)'}
                    value={comment} onChange={(e) => setComment(e.target.value)} disabled={loading}
                    sx={{mt: 1}}
                />
            </Box>
            <Box sx={{px: 3, pb: 3, pt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                <Button onClick={onClose} disabled={loading} sx={{color: C.inkMuted, textTransform: 'none'}}>
                    İmtina
                </Button>
                <Button
                    onClick={() => onConfirm(action, comment)}
                    disabled={loading}
                    variant="contained"
                    sx={{
                        backgroundColor: isApprove ? C.approve : C.reject,
                        color: '#fff', textTransform: 'none', boxShadow: 'none', borderRadius: '8px',
                        '&:hover': {backgroundColor: isApprove ? C.approve : C.reject, opacity: 0.9},
                    }}
                >
                    {loading ? <CircularProgress size={18} sx={{color: '#fff'}}/> : (isApprove ? 'Təsdiqlə' : 'Rədd et')}
                </Button>
            </Box>
        </Dialog>
    );
}