"use client"

import React from 'react';
import Box from '@mui/material/Box';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import ModuleHero from "@/components/ModuleHero";
import BulletinBoard from "@/components/atoms/bulletin/BulletinBoard";
import {GOV} from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Modul"
                title="Elanlar lövhəsi"
                subtitle="Son xəbərlər, fərman və sərəncamlar, daxili qaydalar və bu ay ad günü olan əməkdaşlar."
                breadcrumb={["Elanlar lövhəsi"]}
                icon={<CampaignOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <BulletinBoard/>
        </Box>
    );
}
