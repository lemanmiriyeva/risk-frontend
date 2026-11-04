"use client"
import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {C} from "@/components/theme/tokens";
import {DEPT_STATUS_META, PRIORITY_META, STATUS_META, slaText} from "./ticketMeta";

export function StatusChip({status, label}) {
    const m = STATUS_META[status] || STATUS_META.new;
    return <Chip size="small" label={label || m.label} sx={{backgroundColor: m.bg, color: m.fg, fontWeight: 500}}/>;
}

export function PriorityChip({priority, label}) {
    const m = PRIORITY_META[priority] || PRIORITY_META.medium;
    return (
        <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 13, color: C.ink}}>
            <Box sx={{width: 8, height: 8, borderRadius: '50%', backgroundColor: m.color}}/>
            {label || m.label}
        </Box>
    );
}

/** Şöbə adı sadə mətn kimi; tamamlanıbsa yanında qeyd. */
export function DeptList({departments, max = 2}) {
    const list = departments || [];
    if (!list.length) return <Typography sx={{fontSize: 13, color: C.inkFaint}}>Təyin olunmayıb</Typography>;
    const shown = list.slice(0, max).map((d) => {
        const m = DEPT_STATUS_META[d.status];
        return d.status === 'done' ? `${d.title} (${m.label.toLowerCase()})` : d.title;
    });
    return (
        <Typography sx={{fontSize: 13}}>
            {shown.join(', ')}{list.length > max ? ` +${list.length - max}` : ''}
        </Typography>
    );
}

export function SlaBadge({ticket}) {
    if (!ticket.due_at || ['resolved', 'closed', 'canceled'].includes(ticket.status)) return null;
    const overdue = ticket.is_overdue;
    return (
        <Typography sx={{fontSize: 13, color: overdue ? C.danger : C.inkMuted, fontWeight: overdue ? 600 : 400}}>
            {slaText(ticket.due_at, overdue)}
        </Typography>
    );
}
