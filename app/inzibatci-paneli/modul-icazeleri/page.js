"use client"

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import {useAppSelector} from "@/lib/hooks";
import ModulePermissionsPage from "@/components/atoms/ModulePermissionPage";
import ModuleHero from "@/components/ModuleHero";
import AdminPanelBackLink from "@/components/atoms/AdminPanelBackLink";
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

    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="İdarəetmə"
                title="Modul icazələri"
                subtitle="Qurum və istifadəçilərin modullara girişini tənzimləyin."
                breadcrumb={["İnzibatçı paneli", 'Modul icazələri']}
                icon={<ExtensionOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <Box sx={{p: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '92%', lg: 1400}, mx: 'auto'}}>
                <AdminPanelBackLink/>
                <ModulePermissionsPage isSuperUser={isRoot}/>
            </Box>
        </Box>
    );
}