"use client"

import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import {useAppSelector} from "@/lib/hooks";
import OrgAdminUsersPage from "@/components/atoms/OrgAdminUsersPage";
import OrganizationDetailsPage from "@/components/atoms/OrganizationDetailsPage";
import OrganizationsListPage from "@/components/atoms/OrganizationsListPage";
import ModulePermissionsPage from "@/components/atoms/ModulePermissionPage";
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';

const C = {line: '#E4E1D8', ink: '#1D1B16', inkMuted: '#6B6558', gold: '#9C7A2E'};

export default function Page() {
    const user = useAppSelector((state) => state.user);
    const isRoot = !!user?.is_superuser;
    const isOrgAdmin = !!user?.is_org_admin;
    const [tab, setTab] = useState(0);

    if (!isRoot && !isOrgAdmin) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <Typography color="text.secondary">Bu bölməyə giriş icazəniz yoxdur.</Typography>
            </Box>
        );
    }

    // Root: "Qurumlar" (bütün qurumlar) + "İstifadəçilər" (bütün qurumların user-ləri) + "Modul icazələri"
    // Qurum admini: "Qurum məlumatları" (yalnız öz qurumu) + "İstifadəçilər" (yalnız öz qurumu) + "Modul icazələri"
    const tabs = isRoot
        ? [
            {label: 'Qurumlar', icon: <DomainOutlinedIcon fontSize="small"/>, component: <OrganizationsListPage/>},
            {label: 'İstifadəçilər', icon: <GroupOutlinedIcon fontSize="small"/>, component: <OrgAdminUsersPage/>},
            {label: 'Modul icazələri', icon: <ExtensionOutlinedIcon fontSize="small"/>, component: <ModulePermissionsPage isSuperUser/>},
        ]
        : [
            {label: 'Qurum məlumatları', icon: <DomainOutlinedIcon fontSize="small"/>, component: <OrganizationDetailsPage/>},
            {label: 'İstifadəçilər', icon: <GroupOutlinedIcon fontSize="small"/>, component: <OrgAdminUsersPage/>},
            {label: 'Modul icazələri', icon: <ExtensionOutlinedIcon fontSize="small"/>, component: <ModulePermissionsPage isSuperUser={false}/>},
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
                <Tabs
                    value={tab} onChange={(e, v) => setTab(v)}
                    sx={{
                        mb: 3, minHeight: 40, borderBottom: `1px solid ${C.line}`,
                        '& .MuiTab-root': {textTransform: 'none', minHeight: 40, fontSize: 14, color: C.inkMuted, gap: 0.75},
                        '& .Mui-selected': {color: `${C.ink} !important`, fontWeight: 600},
                        '& .MuiTabs-indicator': {backgroundColor: C.gold},
                    }}
                >
                    {tabs.map((t, i) => (
                        <Tab key={i} label={t.label} icon={t.icon} iconPosition="start"/>
                    ))}
                </Tabs>

                {tabs[tab]?.component}
            </Box>
        </Box>
    );
}