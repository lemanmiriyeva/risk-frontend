"use client"

import {Box} from "@mui/material";
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ManageHistoryOutlinedIcon from '@mui/icons-material/ManageHistoryOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ModuleHero from "@/components/ModuleHero";
import SubModuleCards from "@/components/shell/SubModuleCards";
import {useUserModules} from "@/components/shell/moduleMeta";

const ICONS = {list: ListAltOutlinedIcon, table: TableChartOutlinedIcon, logs: ManageHistoryOutlinedIcon};

export default function Page() {
    const {modules, loading} = useUserModules();
    const riskModule = modules.find((m) => m.url_endpoint === "risk");

    return (
        <Box sx={{minHeight: "100vh"}}>
            <ModuleHero
                eyebrow="Modul"
                title={riskModule?.title || "Risk Reyestr Sistemi"}
                subtitle="İnformasiya aktivləri üzrə risklərin reyestri, risk cədvəli və dəyişiklik jurnalı."
                breadcrumb={[riskModule?.title || "Risk"]}
                icon={<SecurityOutlinedIcon/>}
            />
            <Box sx={{p: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '94%', lg: 1400}, mx: "auto"}}>
                <SubModuleCards module={riskModule} loading={loading} icons={ICONS} fallbackIcon={ListAltOutlinedIcon}
                                emptyText="Risk modulunda heç bir alt bölməyə icazəniz yoxdur. Sistem administratoru ilə əlaqə saxlayın."/>
            </Box>
        </Box>
    );
}
