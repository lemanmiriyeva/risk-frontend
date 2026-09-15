"use client"

import React from 'react';
import Box from '@mui/material/Box';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ModuleHero from "@/components/ModuleHero";
import CircularDetailPage from "@/components/atoms/bulletin/CircularDetailPage";
import {GOV} from "@/components/theme/govColors";

export default function Page({params}) {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Elanlar lövhəsi"
                title="Sənəd"
                subtitle="Sənədin rekvizitləri, faylı və eyni bölmədəki digər sənədlər."
                breadcrumb={["Elanlar lövhəsi", "Sənədlər", "Sənəd"]}
                icon={<FolderOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <CircularDetailPage id={params.id}/>
        </Box>
    );
}
