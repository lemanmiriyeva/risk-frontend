"use client"

import React, {Suspense} from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import {useSearchParams} from 'next/navigation';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ModuleHero from "@/components/ModuleHero";
import CircularsListPage from "@/components/atoms/bulletin/CircularsListPage";
import {GOV} from "@/components/theme/govColors";

function CircularsWithQuery() {
    const searchParams = useSearchParams();
    return <CircularsListPage initialCategory={searchParams.get('category') || 'all'}/>;
}

export default function Page() {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Elanlar lövhəsi"
                title="Normativ sənədlər"
                subtitle="Fərman, sərəncam və daxili qaydalar üzrə sənəd arxivi."
                breadcrumb={["Elanlar lövhəsi", "Sənədlər"]}
                icon={<FolderOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <Suspense fallback={<Box sx={{p: 4}}><Skeleton variant="rounded" height={420}/></Box>}>
                <CircularsWithQuery/>
            </Suspense>
        </Box>
    );
}
