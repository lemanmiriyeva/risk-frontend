"use client"

import Box from '@mui/material/Box';
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import ModuleHero from "@/components/ModuleHero";
import TrainingsListPage from "@/components/atoms/trainings/TrainingsListPage";
import {GOV} from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{backgroundColor: GOV.pageBg, minHeight: '100vh'}}>
            <ModuleHero
                eyebrow="Təlimlər"
                title="Təlim materialları"
                subtitle="Videolara sona qədər baxın, quizi tamamlayın və rəyinizi bildirin."
                breadcrumb={["Təlimlər", "Təlim materialları"]}
                icon={<OndemandVideoOutlinedIcon sx={{fontSize: 26}}/>}
            />
            <TrainingsListPage/>
        </Box>
    );
}
