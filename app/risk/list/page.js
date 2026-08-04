"use client"

import { Box } from "@mui/material";
import ListAltIcon from '@mui/icons-material/ListAlt';
import RiskRegistryPage from "../../../components/atoms/RiskPage";
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Risk · Reyestr"
                title="Risk Reyestri"
                subtitle="Risklərin tam siyahısı — yaradın, redaktə edin və idarə edin."
                breadcrumb={["Risk", "Reyestr"]}
                icon={<ListAltIcon sx={{ fontSize: 26 }} />}
            />
            <RiskRegistryPage/>
        </Box>
    )
}