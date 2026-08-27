"use client"

import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {useAppSelector} from "@/lib/hooks";
import AttendancePermissionConfigPage from "@/components/atoms/AttendancePermissionConfigPage";
import AdminPanelBackLink from "@/components/atoms/AdminPanelBackLink";

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
        <Box>
            <Box sx={{px: {xs: 1.5, sm: 2.5, md: 4}, pt: {xs: 2, md: 3}}}>
                <AdminPanelBackLink/>
            </Box>
            <AttendancePermissionConfigPage/>
        </Box>
    );
}