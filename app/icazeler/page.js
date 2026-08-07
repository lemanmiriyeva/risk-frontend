import AttendancePermissionsPage from "../../components/atoms/AttendancePermissionsPage";

import { Box } from "@mui/material";
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="İcazə Sistemi"
                title="İcazə Sistemi"
                subtitle="İcazələrin tam siyahısı,təsdiqi"
                breadcrumb={["İcazə Sistemi"]}
                icon={<TableChartOutlinedIcon sx={{ fontSize: 26 }} />}
            />
             <AttendancePermissionsPage/>;
        </Box>
    )
}
