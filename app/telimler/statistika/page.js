"use client"

import Box from '@mui/material/Box';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import ModuleHero from "@/components/ModuleHero";
import TrainingStatisticsPage from "@/components/atoms/trainings/TrainingStatisticsPage";
import {GOV} from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Təlimlər"
                title="Təlim statistikası"
                subtitle="Kim hansı təlimə nə vaxt baxıb, quiz nəticələri və istifadəçi rəyləri."
                breadcrumb={["Təlimlər", "Təlim statistikası"]}
                icon={<InsightsOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <TrainingStatisticsPage/>
        </Box>
    );
}
