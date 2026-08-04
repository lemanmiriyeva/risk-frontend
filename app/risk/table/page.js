"use client"

import { Box } from "@mui/material";
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import RiskTableView from "../../../components/atoms/RiskTableView";
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Risk · Cədvəl"
                title="Risk Cədvəlinə Baxış"
                subtitle="Bütün risk qeydlərinin sahələrini cədvəl formatında nəzərdən keçirin və ixrac edin."
                breadcrumb={["Risk", "Cədvəl"]}
                icon={<TableChartOutlinedIcon sx={{ fontSize: 26 }} />}
            />
            <RiskTableView/>
        </Box>
    )
}