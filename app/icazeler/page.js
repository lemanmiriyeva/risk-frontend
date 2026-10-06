import AttendancePermissionsPage from "../../components/atoms/AttendancePermissionsPage";

import { Box } from "@mui/material";
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Modul"
                title="İcazə Sistemi"
                subtitle="İş saatı ərzində çıxış icazələri: sorğu, təsdiq və tarixçə."
                breadcrumb={["İcazə Sistemi"]}
                icon={<EventAvailableOutlinedIcon />}
            />
            <AttendancePermissionsPage/>
        </Box>
    )
}
