"use client"

import React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {useAppSelector} from "@/lib/hooks";
import ModuleHero from "@/components/ModuleHero";
import {GOV} from "@/components/theme/govColors";

export default function Page() {
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const isOrgAdmin = !!user?.is_org_admin;

    if (!isRoot && !isOrgAdmin) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Typography color="text.secondary">Bu bölməyə giriş icazəniz yoxdur.</Typography>
            </Box>
        );
    }

    const tiles = [
        {
            href: '/inzibatci-paneli/qurumlar',
            title: isRoot ? 'Qurumlar' : 'Qurum məlumatları',
            description: isRoot
                ? 'Sistemdəki bütün qurumları yaradın və idarə edin.'
                : 'Öz qurumunuzun məlumatlarını görün və redaktə edin.',
            icon: <DomainOutlinedIcon sx={{fontSize: 26}}/>,
        },
        {
            href: '/inzibatci-paneli/istifadeciler',
            title: 'İstifadəçilər',
            description: isRoot
                ? 'Bütün qurumların istifadəçilərini idarə edin.'
                : 'Qurumunuzun istifadəçilərini idarə edin.',
            icon: <GroupOutlinedIcon sx={{fontSize: 26}}/>,
        },
        {
            href: '/inzibatci-paneli/departamentler',
            title: 'Departamentlər',
            description: 'Qurumların ana və alt departamentlərini idarə edin.',
            icon: <AccountTreeOutlinedIcon sx={{fontSize: 26}}/>,
        },
        {
            href: '/inzibatci-paneli/vezifeler',
            title: 'Vəzifələr',
            description: 'Departamentlərə bağlı vəzifələri idarə edin.',
            icon: <WorkOutlineIcon sx={{fontSize: 26}}/>,
        },
        {
            href: '/inzibatci-paneli/modul-icazeleri',
            title: 'Modul icazələri',
            description: 'Qurum və istifadəçilərin modullara girişini tənzimləyin.',
            icon: <ExtensionOutlinedIcon sx={{fontSize: 26}}/>,
        },
        {
            href: '/inzibatci-paneli/icaze-tenzimlemeleri',
            title: 'İcazə tənzimləmələri',
            description: 'Aparat rəhbəri və şöbə rəhbərlərinin təsdiq axınını tənzimləyin.',
            icon: <TuneOutlinedIcon sx={{fontSize: 26}}/>,
        },
    ];

    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="İdarəetmə"
                title="İnzibatçı paneli"
                subtitle={isRoot ? 'Bütün qurumları və istifadəçiləri idarə edin.' : 'Qurumunuzu və istifadəçilərinizi idarə edin.'}
                breadcrumb={["İnzibatçı paneli"]}
                icon={<AdminPanelSettingsOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <Box sx={{p: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '92%', lg: 1400}, mx: 'auto'}}>
                <Grid container spacing={{xs: 2.5, sm: 3, md: 3.5}}>
                    {tiles.map((tile) => (
                        <Grid item xs={12} sm={6} md={4} key={tile.href}>
                            <Link href={tile.href} style={{textDecoration: 'none', color: 'inherit'}}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        position: 'relative',
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: GOV.cardBorder,
                                        borderTop: `3px solid ${GOV.navy}`,
                                        height: '100%',
                                        overflow: 'hidden',
                                        backgroundColor: '#fff',
                                        transition: 'all 0.25s ease',
                                        '&:hover': {
                                            borderTopColor: GOV.gold,
                                            boxShadow: '0 14px 34px rgba(2,6,36,0.12)',
                                            transform: 'translateY(-4px)',
                                        },
                                        '&:hover .module-arrow': {
                                            backgroundColor: GOV.navy,
                                            color: GOV.gold,
                                            transform: 'translateX(2px)',
                                        },
                                    }}
                                >
                                    <Box sx={{p: 3, display: 'flex', flexDirection: 'column', height: '100%'}}>
                                        <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2}}>
                                            <Box
                                                sx={{
                                                    width: 52,
                                                    height: 52,
                                                    borderRadius: 2,
                                                    backgroundColor: GOV.navy,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: GOV.gold,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {tile.icon}
                                            </Box>
                                            <Box
                                                className="module-arrow"
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    backgroundColor: GOV.pageBg,
                                                    color: GOV.textMuted,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.25s ease',
                                                }}
                                            >
                                                <ArrowForwardIcon sx={{fontSize: 17}}/>
                                            </Box>
                                        </Box>

                                        <Typography sx={{fontWeight: 700, mb: 0.5, color: GOV.textPrimary, fontSize: 17}}>
                                            {tile.title}
                                        </Typography>
                                        <Typography variant="body2" sx={{color: GOV.textMuted, flexGrow: 1}}>
                                            {tile.description}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Link>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
}