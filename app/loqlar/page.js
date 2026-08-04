"use client"

import { Box } from "@mui/material";
import HistoryIcon from '@mui/icons-material/History';
import ActivityLogTable from "../../components/atoms/ActivityLogTable";
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Modul"
                title="Loqlar"
                subtitle="Sistemdə baş vermiş bütün fəaliyyətlərin tarixçəsi — giriş/çıxış, baxışlar və dəyişikliklər."
                breadcrumb={["Loqlar"]}
                icon={<HistoryIcon sx={{ fontSize: 26 }} />}
            />
            <ActivityLogTable/>
        </Box>
    )
}