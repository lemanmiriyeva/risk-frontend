"use client"
import React from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import {C} from "@/components/theme/tokens";

function Item({label, value, onClick, active}) {
    const content = (
        <>
            <Typography component="span" sx={{fontSize: 20, fontWeight: 600, color: C.ink, mr: 1}}>{value ?? '—'}</Typography>
            <Typography component="span" sx={{fontSize: 13, color: active ? C.ink : C.inkMuted, fontWeight: active ? 600 : 400}}>{label}</Typography>
        </>
    );
    if (!onClick) return <Box sx={{display: 'flex', alignItems: 'baseline'}}>{content}</Box>;
    return (
        <ButtonBase onClick={onClick} sx={{display: 'flex', alignItems: 'baseline', borderBottom: `2px solid ${active ? C.ink : 'transparent'}`}}>
            {content}
        </ButtonBase>
    );
}

export default function TicketStats({stats, quick, onQuick}) {
    if (!stats) return null;
    return (
        <Box sx={{display: 'flex', gap: {xs: 2.5, sm: 4}, flexWrap: 'wrap', mb: 3}}>
            <Item label="aktiv" value={stats.active} active={quick === 'active'} onClick={() => onQuick('active')}/>
            <Item label="gecikən" value={stats.overdue} active={quick === 'overdue'} onClick={() => onQuick('overdue')}/>
            <Item label="təyin olunmayan" value={stats.unassigned} active={quick === 'unassigned'} onClick={() => onQuick('unassigned')}/>
            <Item label="cəmi" value={stats.total}/>
        </Box>
    );
}
