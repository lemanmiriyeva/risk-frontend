import OperationsPage from "../../components/atoms/OperationsPage";

import { Box } from "@mui/material";
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Modul"
                title="Əməliyyatlar"
                subtitle="Bütün modullarda baş vermiş əməliyyatlar - yaradılma, redaktə, silinmə və təsdiq tələb edən sorğular."
                breadcrumb={["Əməliyyatlar"]}
                icon={<FactCheckOutlinedIcon sx={{ fontSize: 26 }} />}
            />
            <OperationsPage/>
        </Box>
    )
}