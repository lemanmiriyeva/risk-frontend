"use client"
import Link from "next/link";
import {Box, Grid, Typography, Skeleton} from "@mui/material";
import EastIcon from '@mui/icons-material/East';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {BRAND, C, SERIF_STACK} from "@/components/theme/tokens";
import {reveal} from "@/components/theme/motion";
import {moduleAccent} from "./moduleMeta";

/**
 * Modulun giriş səhifəsində alt bölmələrin kartları (Risk, Təlimlər və s.).
 * icons: {<sub url_endpoint>: <Icon komponenti>}
 */
export default function SubModuleCards({module, loading, icons = {}, fallbackIcon: Fallback, emptyText}) {
    const subs = module?.sub_modules || [];
    const accent = moduleAccent(module?.url_endpoint);

    if (loading) {
        return (
            <Grid container spacing={2.5}>
                {[0, 1, 2].map((i) => (
                    <Grid item xs={12} sm={6} lg={4} key={i}><Skeleton variant="rounded" height={190} sx={{borderRadius: '6px'}}/></Grid>
                ))}
            </Grid>
        );
    }

    if (!module || subs.length === 0) {
        return (
            <Box sx={{py: 8, textAlign: 'center'}}>
                <Box sx={{width: 60, height: 60, borderRadius: '16px', mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: C.surfaceDeep, color: C.inkMuted}}>
                    <LockOutlinedIcon sx={{fontSize: 28}}/>
                </Box>
                <Typography sx={{fontSize: 18, fontWeight: 720, color: C.ink, mb: 0.75}}>Giriş icazəniz yoxdur</Typography>
                <Typography sx={{fontSize: 14, color: C.inkMuted, maxWidth: 420, mx: 'auto'}}>
                    {emptyText || 'Bu modulda heç bir bölməyə icazəniz yoxdur. Sistem administratoru ilə əlaqə saxlayın.'}
                </Typography>
            </Box>
        );
    }

    const items = subs.map((sub) => ({
        key: sub.id, href: `/${module.url_endpoint}/${sub.url_endpoint}`, title: sub.title,
        description: sub.description, Icon: icons[sub.url_endpoint] || Fallback,
    }));
    return <LinkCardGrid items={items} accent={accent}/>;
}

/** Nömrələnmiş keçid kartları (modul giriş səhifələri, inzibatçı paneli). */
export function LinkCardGrid({items, accent}) {
    return (
        <Grid container spacing={3}>
            {items.map(({key, href, title, description, Icon}, idx) => (
                <Grid item xs={12} sm={6} lg={4} key={key || href}>
                    <Box component={Link} href={href} sx={{
                        position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 190,
                        p: 3, borderRadius: '6px', textDecoration: 'none', color: 'inherit',
                        backgroundColor: '#fff', border: `1px solid ${C.line}`, overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(6,18,38,0.04)',
                        transition: 'transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease',
                        '&::before': {
                            content: '""', position: 'absolute', left: 0, top: 0, right: 0, height: 3, backgroundColor: accent,
                            transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform .45s cubic-bezier(.2,.7,.2,1)',
                        },
                        '&:hover': {transform: 'translateY(-4px)', boxShadow: '0 22px 48px rgba(6,18,38,0.12)'},
                        '&:hover::before': {transform: 'scaleX(1)'},
                        '&:hover .lc-icon': {backgroundColor: accent, color: '#fff', borderColor: accent},
                        '&:hover .lc-arrow': {transform: 'translateX(6px)', color: accent},
                        ...reveal(idx, 0.2, 0.07),
                    }}>
                        <Typography aria-hidden sx={{
                            position: 'absolute', right: 22, top: 14, fontFamily: SERIF_STACK, fontSize: 44, fontWeight: 600, lineHeight: 1,
                            color: `${accent}1A`, userSelect: 'none',
                        }}>
                            {String(idx + 1).padStart(2, '0')}
                        </Typography>
                        <Box className="lc-icon" sx={{width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: accent, border: `1px solid ${accent}40`, backgroundColor: `${accent}0D`, mb: 2.25, transition: 'all .35s ease'}}>
                            {Icon && <Icon sx={{fontSize: 25}}/>}
                        </Box>
                        <Typography sx={{fontFamily: SERIF_STACK, fontSize: 19, fontWeight: 600, color: BRAND.navy900, lineHeight: 1.3}}>{title}</Typography>
                        {description && (
                            <Typography sx={{fontSize: 13.5, color: C.inkMuted, mt: 0.75, lineHeight: 1.6}}>{description}</Typography>
                        )}
                        <Box sx={{flex: 1}}/>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 2.25, color: C.inkMuted}}>
                            <Typography sx={{fontSize: 13, fontWeight: 650}}>Bölməyə keç</Typography>
                            <EastIcon className="lc-arrow" sx={{fontSize: 17, transition: 'transform .3s ease, color .3s ease'}}/>
                        </Box>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );
}
