"use client"

import { Box } from "@mui/material";
import DescriptionIcon from '@mui/icons-material/Description';
import RiskLogsPage from "../../../components/atoms/RiskLogTable";
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Risk · Tarixçə"
                title="Risk Reyestri — Tarixçə"
                subtitle="Risk qeydlərinə edilmiş bütün dəyişikliklərin audit tarixçəsi."
                breadcrumb={["Risk", "Loqlar"]}
                icon={<DescriptionIcon sx={{ fontSize: 26 }} />}
            />
            <RiskLogsPage/>
        </Box>
    )
}