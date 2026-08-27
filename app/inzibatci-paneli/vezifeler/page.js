"use client"

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import {useAppSelector} from "@/lib/hooks";
import RolesPage from "@/components/atoms/RolesPage";
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
                title="Vəzifələr"
                subtitle="Departamentlərə bağlı vəzifələri idarə edin."
                breadcrumb={["İnzibatçı paneli", 'Vəzifələr']}
                icon={<WorkOutlineIcon sx={{fontSize: 26}}/>}
            />
            <Box sx={{p: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '92%', lg: 1400}, mx: 'auto'}}>
                <AdminPanelBackLink/>
                <RolesPage/>
            </Box>
        </Box>
    );
}