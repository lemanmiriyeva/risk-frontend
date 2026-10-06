"use client"

import React, {Suspense} from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import {useSearchParams} from 'next/navigation';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ModuleHero from "@/components/ModuleHero";
import {CircularFormPage} from "@/components/atoms/bulletin/BulletinFormPages";
import {GOV} from "@/components/theme/govColors";

function Body() {
    const searchParams = useSearchParams();
    return <CircularFormPage initialCategoryKey={searchParams.get("category") || ""}/>;
}

export default function Page({params}) {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Elanlar lövhəsi"
                title="Yeni sənəd"
                breadcrumb={["Elanlar lövhəsi", "Sənədlər", "Yeni sənəd"]}
                icon={<FolderOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <Suspense fallback={<Box sx={{p: 4}}><Skeleton variant="rounded" height={420}/></Box>}>
                <Body params={params}/>
            </Suspense>
        </Box>
    );
}
