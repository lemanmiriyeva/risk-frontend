import NotificationsPage from "../../components/atoms/NotificationsPage";

import { Box } from "@mui/material";
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Bildirişlər"
                title="Bildirişlər"
                subtitle="Bütün bildirişləriniz və filtrləri"
                breadcrumb={["Bildirişlər"]}
                icon={<NotificationsOutlinedIcon sx={{ fontSize: 26 }} />}
            />
            <NotificationsPage/>
        </Box>
    )
}