"use client"

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import {useAppSelector} from "@/lib/hooks";
import ModuleHero from "@/components/ModuleHero";
import {GOV} from "@/components/theme/govColors";
import {LinkCardGrid} from "@/components/shell/SubModuleCards";
import {moduleAccent} from "@/components/shell/moduleMeta";

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
            Icon: DomainOutlinedIcon,
        },
        {
            href: '/inzibatci-paneli/istifadeciler',
            title: 'İstifadəçilər',
            description: isRoot
                ? 'Bütün qurumların istifadəçilərini idarə edin.'
                : 'Qurumunuzun istifadəçilərini idarə edin.',
            Icon: GroupOutlinedIcon,
        },
        {
            href: '/inzibatci-paneli/departamentler',
            title: 'Departamentlər',
            description: 'Qurumların ana və alt departamentlərini idarə edin.',
            Icon: AccountTreeOutlinedIcon,
        },
        {
            href: '/inzibatci-paneli/vezifeler',
            title: 'Vəzifələr',
            description: 'Departamentlərə bağlı vəzifələri idarə edin.',
            Icon: WorkOutlineIcon,
        },
        {
            href: '/inzibatci-paneli/modul-icazeleri',
            title: 'Modul icazələri',
            description: 'Qurum və istifadəçilərin modullara girişini tənzimləyin.',
            Icon: ExtensionOutlinedIcon,
        },
        {
            href: '/inzibatci-paneli/icaze-tenzimlemeleri',
            title: 'İcazə tənzimləmələri',
            description: 'Aparat rəhbəri və şöbə rəhbərlərinin təsdiq axınını tənzimləyin.',
            Icon: TuneOutlinedIcon,
        },
    ];

    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="İdarəetmə"
                title="İnzibatçı paneli"
                subtitle={isRoot ? 'Bütün qurumları və istifadəçiləri idarə edin.' : 'Qurumunuzu və istifadəçilərinizi idarə edin.'}
                breadcrumb={["İnzibatçı paneli"]}
                icon={<AdminPanelSettingsOutlinedIcon/>}
            />
            <Box sx={{p: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '94%', lg: 1400}, mx: 'auto'}}>
                <LinkCardGrid items={tiles} accent={moduleAccent('inzibatci-paneli')}/>
            </Box>
        </Box>
    );
}