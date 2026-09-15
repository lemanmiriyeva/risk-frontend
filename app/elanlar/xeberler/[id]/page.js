"use client"

import React from 'react';
import Box from '@mui/material/Box';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import ModuleHero from "@/components/ModuleHero";
import NewsDetailPage from "@/components/atoms/bulletin/NewsDetailPage";
import {GOV} from "@/components/theme/govColors";

export default function Page({params}) {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Elanlar lövhəsi"
                title="Xəbər"
                subtitle="Xəbərin tam mətni və əlaqəli materiallar."
                breadcrumb={["Elanlar lövhəsi", "Xəbərlər", "Xəbər"]}
                icon={<NewspaperOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <NewsDetailPage id={params.id}/>
        </Box>
    );
}
