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
                title="Əməliyyatlarım"
                subtitle="Yalnız sizin etdiyiniz əməliyyatlar və sizdən təsdiq gözləyən sorğular («Daxil olanlar»)."
                breadcrumb={["Əməliyyatlarım"]}
                icon={<FactCheckOutlinedIcon sx={{ fontSize: 26 }} />}
            />
            <OperationsPage/>
        </Box>
    )
}