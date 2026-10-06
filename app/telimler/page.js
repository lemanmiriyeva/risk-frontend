"use client"

import {Box} from "@mui/material";
import OndemandVideoOutlinedIcon from '@mui/icons-material/OndemandVideoOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import ModuleHero from "@/components/ModuleHero";
import SubModuleCards from "@/components/shell/SubModuleCards";
import {useUserModules} from "@/components/shell/moduleMeta";

/*
 * Təlimlər modulunun giriş səhifəsi. Yalnız istifadəçinin icazəsi olan alt
 * modullar (Təlim materialları / Təlim statistikası) göstərilir - hər birinin
 * girişi və admini ayrıca təyin olunur.
 */
const ICONS = {materiallar: OndemandVideoOutlinedIcon, statistika: InsightsOutlinedIcon};

export default function Page() {
    const {modules, loading} = useUserModules();
    const trainingsModule = modules.find((m) => m.url_endpoint === "telimler");

    return (
        <Box sx={{minHeight: "100vh"}}>
            <ModuleHero
                eyebrow="Modul"
                title={trainingsModule?.title || "Təlimlər"}
                subtitle="Təlim videoları, quizlər və təlim statistikası."
                breadcrumb={[trainingsModule?.title || "Təlimlər"]}
                icon={<SchoolOutlinedIcon/>}
            />
            <Box sx={{p: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '94%', lg: 1400}, mx: "auto"}}>
                <SubModuleCards module={trainingsModule} loading={loading} icons={ICONS} fallbackIcon={SchoolOutlinedIcon}
                                emptyText="Təlimlər modulunda heç bir bölməyə icazəniz yoxdur."/>
            </Box>
        </Box>
    );
}
