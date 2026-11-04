"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import {C} from "@/components/theme/tokens";
import {BOARD_COLUMNS, PRIORITY_META, STATUS_META} from "./ticketMeta";
import {DeptChip, SlaBadge} from "./TicketBadges";

function initials(name) {
    return (name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function Card({ticket, onOpen, onDragStart}) {
    const prio = PRIORITY_META[ticket.priority] || PRIORITY_META.medium;
    return (
        <Box
            draggable onDragStart={(e) => onDragStart(e, ticket)} onClick={() => onOpen(ticket)}
            sx={{
                p: 1.5, mb: 1.25, borderRadius: '8px', backgroundColor: C.surface, cursor: 'grab',
                border: `1px solid ${ticket.is_overdue ? '#E7A3AA' : C.line}`,
                borderLeft: `4px solid ${ticket.category_color || prio.color}`,
                '&:hover': {boxShadow: '0 6px 16px rgba(6,18,38,0.10)'}, '&:active': {cursor: 'grabbing'},
            }}
        >
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5}}>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint, fontWeight: 600}}>{ticket.number}</Typography>
                <Tooltip title={`Prioritet: ${prio.label}`}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11.5, color: prio.fg, fontWeight: 600}}>
                        <Box sx={{width: 8, height: 8, borderRadius: '50%', backgroundColor: prio.color}}/>{prio.label}
                    </Box>
                </Tooltip>
            </Box>
            <Typography sx={{
                fontSize: 13.5, fontWeight: 600, color: C.ink, lineHeight: 1.35, mb: 1,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
                {ticket.title}
            </Typography>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1}}>
                {(ticket.departments || []).slice(0, 3).map((d) => <DeptChip key={d.id} dept={d}/>)}
                {(ticket.departments || []).length > 3 && (
                    <Typography sx={{fontSize: 11.5, color: C.inkFaint, alignSelf: 'center'}}>+{ticket.departments.length - 3}</Typography>
                )}
            </Box>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0}}>
                    <SlaBadge ticket={ticket} compact/>
                    {ticket.comment_count > 0 && (
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.4, fontSize: 12, color: C.inkMuted}}>
                            <CommentOutlinedIcon sx={{fontSize: 14}}/>{ticket.comment_count}
                        </Box>
                    )}
                </Box>
                <Tooltip title={ticket.assignee_name ? `İcraçı: ${ticket.assignee_name}` : 'İcraçı təyin olunmayıb'}>
                    <Avatar sx={{width: 24, height: 24, fontSize: 11, bgcolor: ticket.assignee_name ? '#173560' : C.surfaceDeep, color: ticket.assignee_name ? '#fff' : C.inkFaint}}>
                        {ticket.assignee_name ? initials(ticket.assignee_name) : '?'}
                    </Avatar>
                </Tooltip>
            </Box>
            <Typography sx={{fontSize: 11.5, color: C.inkFaint, mt: 0.75}}>
                {ticket.requester_name}{ticket.requester_department ? ` · ${ticket.requester_department}` : ''}
            </Typography>
        </Box>
    );
}

/** Kanban lövhəsi: kartı sürüşdürüb başqa sütuna buraxmaq statusu dəyişir (server icazəni yoxlayır). */
export default function TicketBoard({tickets, onOpen, onMove}) {
    const [dragOver, setDragOver] = useState(null);

    function onDragStart(e, ticket) {
        e.dataTransfer.setData('text/plain', String(ticket.id));
        e.dataTransfer.effectAllowed = 'move';
    }

    function onDrop(e, status) {
        e.preventDefault();
        setDragOver(null);
        const id = Number(e.dataTransfer.getData('text/plain'));
        const ticket = tickets.find((t) => t.id === id);
        if (ticket && ticket.status !== status) onMove(ticket, status);
    }

    return (
        <Box sx={{display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, alignItems: 'flex-start'}}>
            {BOARD_COLUMNS.map((status) => {
                const m = STATUS_META[status];
                const items = tickets.filter((t) => t.status === status);
                return (
                    <Box
                        key={status}
                        onDragOver={(e) => {e.preventDefault(); setDragOver(status);}}
                        onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
                        onDrop={(e) => onDrop(e, status)}
                        sx={{
                            flex: '1 0 270px', minWidth: 270, maxWidth: 340, p: 1.25, borderRadius: '10px',
                            backgroundColor: dragOver === status ? 'rgba(10,108,194,0.08)' : C.surfaceDeep,
                            border: `1px dashed ${dragOver === status ? '#0A6CC2' : 'transparent'}`, minHeight: 200,
                        }}
                    >
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, px: 0.5, mb: 1.25}}>
                            <Box sx={{width: 9, height: 9, borderRadius: '50%', backgroundColor: m.dot}}/>
                            <Typography sx={{fontSize: 13, fontWeight: 700, color: C.ink}}>{m.label}</Typography>
                            <Typography sx={{fontSize: 12, color: C.inkFaint, fontWeight: 600}}>{items.length}</Typography>
                        </Box>
                        {items.map((t) => <Card key={t.id} ticket={t} onOpen={onOpen} onDragStart={onDragStart}/>)}
                        {!items.length && (
                            <Typography sx={{fontSize: 12.5, color: C.inkFaint, textAlign: 'center', py: 3}}>Müraciət yoxdur</Typography>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
