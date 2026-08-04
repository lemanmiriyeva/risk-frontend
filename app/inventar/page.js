"use client"

import { Box } from "@mui/material";
import WarehouseIcon from '@mui/icons-material/Warehouse';
import InventoryTable from "../../components/atoms/InventoryTable";
import ModuleHero from "@/components/ModuleHero";
import { GOV } from "@/components/theme/govColors";

export default function Page() {
    return (
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Modul"
                title="İnventar Uçotu"
                subtitle="Sistemdəki bütün inventar qeydləri."
                breadcrumb={["İnventar"]}
                icon={<WarehouseIcon sx={{ fontSize: 26 }} />}
            />
            <InventoryTable/>
        </Box>
    );
}