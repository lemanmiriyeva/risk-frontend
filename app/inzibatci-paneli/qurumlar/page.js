"use client"

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import DomainOutlinedIcon from '@mui/icons-material/DomainOutlined';
import {useAppSelector} from "@/lib/hooks";
import OrganizationDetailsPage from "@/components/atoms/OrganizationDetailsPage";
import OrganizationsListPage from "@/components/atoms/OrganizationsListPage";
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
                title={isRoot ? 'Qurumlar' : 'Qurum məlumatları'}
                subtitle={isRoot ? 'Sistemdəki bütün qurumları yaradın və idarə edin.' : 'Öz qurumunuzun məlumatlarını görün və redaktə edin.'}
                breadcrumb={["İnzibatçı paneli", isRoot ? 'Qurumlar' : 'Qurum məlumatları']}
                icon={<DomainOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <Box sx={{p: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '92%', lg: 1400}, mx: 'auto'}}>
                <AdminPanelBackLink/>
                {isRoot ? <OrganizationsListPage/> : <OrganizationDetailsPage/>}
            </Box>
        </Box>
    );
}