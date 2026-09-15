"use client"

import React from 'react';
import Box from '@mui/material/Box';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import ModuleHero from "@/components/ModuleHero";
import BirthdaysPage from "@/components/atoms/bulletin/BirthdaysPage";
import {GOV} from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Elanlar lövhəsi"
                title="Ad günləri"
                subtitle="Cari ay üzrə ad günü təqvimi, şöbə filtri və axtarış."
                breadcrumb={["Elanlar lövhəsi", "Ad günləri"]}
                icon={<CakeOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <BirthdaysPage/>
        </Box>
    );
}
