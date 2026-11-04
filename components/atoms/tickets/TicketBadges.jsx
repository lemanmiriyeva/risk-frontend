"use client"
import React from 'react';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {C} from "@/components/theme/tokens";
import {DEPT_STATUS_META, PRIORITY_META, STATUS_META, formatDateTime, slaText} from "./ticketMeta";

export function StatusChip({status, label}) {
    const m = STATUS_META[status] || STATUS_META.new;
    return <Chip size="small" label={label || m.label} sx={{backgroundColor: m.bg, color: m.fg, fontWeight: 600, height: 24}}/>;
}

export function PriorityChip({priority, label}) {
    const m = PRIORITY_META[priority] || PRIORITY_META.medium;
    return (
        <Chip
            size="small" label={label || m.label}
            icon={<Box sx={{width: 8, height: 8, borderRadius: '50%', backgroundColor: m.color, ml: '8px !important'}}/>}
            sx={{backgroundColor: m.bg, color: m.fg, fontWeight: 600, height: 24}}
        />
    );
}

export function DeptChip({dept}) {
    const m = DEPT_STATUS_META[dept.status] || DEPT_STATUS_META.pending;
    return (
        <Tooltip title={`${dept.title} — ${m.label}`}>
            <Chip size="small" label={dept.title} variant="outlined"
                  sx={{height: 22, fontSize: 11.5, borderColor: dept.status === 'done' ? '#1F7A4D' : C.lineStrong, color: m.fg, backgroundColor: m.bg}}/>
        </Tooltip>
    );
}

export function SlaBadge({ticket, compact}) {
    if (!ticket.due_at || ['resolved', 'closed', 'canceled'].includes(ticket.status)) return null;
    const overdue = ticket.is_overdue;
    const text = slaText(ticket.due_at, overdue);
    return (
        <Tooltip title={`SLA: ${formatDateTime(ticket.due_at)}`}>
            <Box sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 12, fontWeight: overdue ? 700 : 500,
                color: overdue ? C.danger : C.inkMuted}}>
                <AccessTimeIcon sx={{fontSize: 14}}/>
                {!compact && text}
                {compact && (overdue ? 'Gecikir' : text)}
            </Box>
        </Tooltip>
    );
}
