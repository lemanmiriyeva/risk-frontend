"use client"
import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import {Box, Typography} from '@mui/material';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {BRAND, C} from "@/components/theme/tokens";

const countOf = (res) => (typeof res.data?.count === 'number' ? res.data.count : (res.data?.results || res.data || []).length);

/** Ana səhifənin yuxarı sırası: gündəlik işlər. Altından xətt çəkilir, digər modullar onun aşağısındadır. */
export default function HomeQuickLinks({hasOperations, hasSupport}) {
    const [incoming, setIncoming] = useState(null);

    useEffect(() => {
        if (!hasOperations) return;
        service_api.get(`${NEXT_API_ENDPOINTS.OPERATIONS.LIST}?scope=incoming`)
            .then((res) => setIncoming(countOf(res)))
            .catch(() => setIncoming(null));
    }, [hasOperations]);

    const items = [
        hasOperations && {href: '/emeliyyatlar?scope=incoming', title: 'Daxil olanlar', hint: 'Sizdən təsdiq gözləyən sorğular',
            Icon: MoveToInboxOutlinedIcon, accent: '#C42F3D', badge: incoming},
        hasOperations && {href: '/emeliyyatlar', title: 'Əməliyyatlarım', hint: 'Etdiyiniz əməliyyatların siyahısı',
            Icon: FactCheckOutlinedIcon, accent: '#6B4FB5'},
        hasSupport && {href: '/muracietler', title: 'Texniki dəstək sistemi', hint: 'Problem və sorğularınız',
            Icon: SupportAgentOutlinedIcon, accent: '#0A6CC2'},
    ].filter(Boolean);

    if (!items.length) return null;

    return (
        <Box sx={{pb: 3, mb: 3, borderBottom: `2px solid ${BRAND.navy900}`}}>
            <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)'}}}>
                {items.map(({href, title, hint, Icon, accent, badge}) => (
                    <Box key={title} component={Link} href={href} sx={{
                        display: 'flex', alignItems: 'center', gap: 2, p: 2.25, textDecoration: 'none', color: 'inherit',
                        backgroundColor: C.surface, border: `1px solid ${C.line}`, borderLeft: `4px solid ${accent}`, borderRadius: '10px',
                        transition: 'box-shadow .2s ease, transform .2s ease',
                        '&:hover': {boxShadow: '0 10px 24px rgba(6,18,38,0.10)', transform: 'translateY(-2px)'},
                    }}>
                        <Box sx={{width: 46, height: 46, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: accent, backgroundColor: `${accent}14`, flexShrink: 0}}>
                            <Icon sx={{fontSize: 25}}/>
                        </Box>
                        <Box sx={{minWidth: 0, flex: 1}}>
                            <Typography sx={{fontSize: 15.5, fontWeight: 700, color: BRAND.navy900, lineHeight: 1.25}}>{title}</Typography>
                            <Typography sx={{fontSize: 12.5, color: C.inkMuted, mt: 0.25}}>{hint}</Typography>
                        </Box>
                        {badge > 0 && (
                            <Box sx={{minWidth: 26, height: 26, px: 0.75, borderRadius: '13px', backgroundColor: accent, color: '#fff',
                                fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                {badge}
                            </Box>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
