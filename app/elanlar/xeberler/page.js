"use client"

import React from 'react';
import Box from '@mui/material/Box';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import ModuleHero from "@/components/ModuleHero";
import NewsListPage from "@/components/atoms/bulletin/NewsListPage";
import {GOV} from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Elanlar lövhəsi"
                title="Xəbərlər"
                subtitle="Qurum üzrə dərc edilmiş bütün xəbərlər, axtarış və il üzrə arxiv."
                breadcrumb={["Elanlar lövhəsi", "Xəbərlər"]}
                icon={<NewspaperOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <NewsListPage/>
        </Box>
    );
}
