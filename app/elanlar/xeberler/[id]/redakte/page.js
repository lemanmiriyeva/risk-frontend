"use client"

import React, {Suspense} from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined';
import ModuleHero from "@/components/ModuleHero";
import {NewsFormPage} from "@/components/atoms/bulletin/BulletinFormPages";
import {GOV} from "@/components/theme/govColors";

function Body({params}) {
    return <NewsFormPage id={params.id}/>;
}

export default function Page({params}) {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Elanlar lövhəsi"
                title="Xəbəri redaktə et"
                breadcrumb={["Elanlar lövhəsi", "Xəbərlər", "Redaktə"]}
                icon={<NewspaperOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <Suspense fallback={<Box sx={{p: 4}}><Skeleton variant="rounded" height={420}/></Box>}>
                <Body params={params}/>
            </Suspense>
        </Box>
    );
}
