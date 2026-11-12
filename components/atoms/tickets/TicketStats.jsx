"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {C} from "@/components/theme/tokens";

/** Sürətli filtr düymələri: basanda siyahı həmin şərtlə süzülür, təkrar basanda ləğv olur. */
export default function TicketStats({stats, quick, onQuick}) {
    if (!stats) return null;
    const items = [
        {key: 'active', label: 'Aktiv', value: stats.active},
        {key: 'overdue', label: 'Gecikən', value: stats.overdue},
        {key: 'unassigned', label: 'Təyin olunmayan', value: stats.unassigned},
    ];
    return (
        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2.5}}>
            {items.map((i) => (
                <Button key={i.key} size="small" variant={quick === i.key ? 'contained' : 'outlined'} onClick={() => onQuick(i.key)}>
                    {i.label}: {i.value ?? 0}
                </Button>
            ))}
            <Typography sx={{fontSize: 13, color: C.inkMuted, ml: 1}}>Cəmi: {stats.total ?? 0}</Typography>
        </Box>
    );
}