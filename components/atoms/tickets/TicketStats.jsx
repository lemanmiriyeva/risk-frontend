"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {C} from "@/components/theme/tokens";

function StatCard({label, value, hint, color, onClick, active}) {
    return (
        <Box
            onClick={onClick} role={onClick ? 'button' : undefined}
            sx={{
                flex: '1 1 150px', minWidth: 150, p: 2, borderRadius: '10px', backgroundColor: C.surface,
                border: `1px solid ${active ? color : C.line}`, borderLeft: `4px solid ${color}`,
                cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow .15s, transform .15s',
                boxShadow: active ? `0 0 0 2px ${color}22` : 'none',
                '&:hover': onClick ? {boxShadow: '0 6px 18px rgba(6,18,38,0.08)', transform: 'translateY(-1px)'} : {},
            }}
        >
            <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600}}>
                {label}
            </Typography>
            <Typography sx={{fontSize: 28, fontWeight: 700, color: C.ink, lineHeight: 1.2, mt: 0.5}}>{value ?? '—'}</Typography>
            {hint && <Typography sx={{fontSize: 12, color: C.inkMuted, mt: 0.25}}>{hint}</Typography>}
        </Box>
    );
}

function Trend({data}) {
    if (!data?.length) return null;
    const max = Math.max(1, ...data.map((d) => Math.max(d.created, d.resolved)));
    return (
        <Box sx={{flex: '2 1 320px', minWidth: 280, p: 2, borderRadius: '10px', backgroundColor: C.surface, border: `1px solid ${C.line}`}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                <Typography sx={{fontSize: 11.5, color: C.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600}}>
                    Son 14 gün
                </Typography>
                <Box sx={{display: 'flex', gap: 1.5, fontSize: 11.5, color: C.inkMuted}}>
                    <span><Box component="span" sx={{display: 'inline-block', width: 8, height: 8, borderRadius: '2px', backgroundColor: '#0A6CC2', mr: 0.5}}/>Yaradılan</span>
                    <span><Box component="span" sx={{display: 'inline-block', width: 8, height: 8, borderRadius: '2px', backgroundColor: '#1F7A4D', mr: 0.5}}/>Həll edilən</span>
                </Box>
            </Box>
            <Box sx={{display: 'flex', alignItems: 'flex-end', gap: '6px', height: 64}}>
                {data.map((d) => (
                    <Box key={d.date} title={`${d.date}: ${d.created} yaradılıb, ${d.resolved} həll edilib`}
                         sx={{flex: 1, display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100%'}}>
                        <Box sx={{flex: 1, height: `${Math.max(d.created ? 8 : 2, (d.created / max) * 100)}%`, backgroundColor: '#0A6CC2', borderRadius: '2px 2px 0 0', opacity: d.created ? 1 : 0.2}}/>
                        <Box sx={{flex: 1, height: `${Math.max(d.resolved ? 8 : 2, (d.resolved / max) * 100)}%`, backgroundColor: '#1F7A4D', borderRadius: '2px 2px 0 0', opacity: d.resolved ? 1 : 0.2}}/>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export default function TicketStats({stats, quick, onQuick}) {
    if (!stats) return null;
    return (
        <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3}}>
            <StatCard label="Aktiv" value={stats.active} hint={`Cəmi ${stats.total}`} color="#0A6CC2"
                      active={quick === 'active'} onClick={() => onQuick('active')}/>
            <StatCard label="Gecikən (SLA)" value={stats.overdue} color="#C42F3D"
                      active={quick === 'overdue'} onClick={() => onQuick('overdue')}/>
            <StatCard label="Təyin olunmayan" value={stats.unassigned} color="#D9731A"
                      active={quick === 'unassigned'} onClick={() => onQuick('unassigned')}/>
            <StatCard label="Orta həll müddəti" value={stats.avg_resolution_hours != null ? `${stats.avg_resolution_hours} s` : '—'}
                      hint={stats.sla_compliance != null ? `SLA uyğunluğu: ${stats.sla_compliance}%` : 'Məlumat yoxdur'} color="#1F7A4D"/>
            <StatCard label="Məmnuniyyət" value={stats.avg_rating != null ? `${stats.avg_rating} / 5` : '—'}
                      hint={stats.rating_count ? `${stats.rating_count} qiymət` : 'Qiymət verilməyib'} color="#C99A1E"/>
            <Trend data={stats.trend}/>
        </Box>
    );
}
