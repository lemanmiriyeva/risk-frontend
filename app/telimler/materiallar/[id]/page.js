"use client"

import Box from '@mui/material/Box';
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import ModuleHero from "@/components/ModuleHero";
import TrainingPlayerPage from "@/components/atoms/trainings/TrainingPlayerPage";
import {GOV} from "@/components/theme/govColors";

export default function Page({params}) {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Təlimlər"
                title="Təlim materialı"
                breadcrumb={["Təlimlər", "Təlim materialları", "Baxış"]}
                icon={<OndemandVideoOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <TrainingPlayerPage id={params.id}/>
        </Box>
    );
}
