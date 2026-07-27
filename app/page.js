"use client"
import Link from "next/link";
import { useEffect, useState } from "react";
import { Grid, Typography, Box, Paper, CircularProgress } from "@mui/material";
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useAppSelector } from "@/lib/hooks";
import { service_api } from "@/app/service";
import { NEXT_API_ENDPOINTS } from "@/app/urls";

// Permission-a görə ikon/rəng — yeni modul əlavə etdikcə bura yeni sətir əlavə edin
const ICON_MAP = {
    "risk.view_risk": { icon: <SecurityIcon sx={{ fontSize: 40 }} />, color: "#e3f2fd", iconColor: "#1976d2" },
    "risk.view_risklog": { icon: <AssignmentIcon sx={{ fontSize: 40 }} />, color: "#e8f5e9", iconColor: "#2e7d32" },
};
const DEFAULT_ICON = { icon: <ViewModuleIcon sx={{ fontSize: 40 }} />, color: "#f3f4f6", iconColor: "#374151" };

export default function Home() {
    const userState = useAppSelector((state) => state.user);
    const isLoaded = userState?.isLoaded;
    const permissions = userState?.permissions || [];

    const [modules, setModules] = useState([]);
    const [modulesLoading, setModulesLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.MODULES);
                setModules(res.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setModulesLoading(false);
            }
        })();
    }, []);

    const visibleModules = modules
        .filter((m) => permissions.includes(m.permission))
        .map((m) => {
            const useElevated = m.elevated_permission && permissions.includes(m.elevated_permission) && m.elevated_path;
            return {
                ...m,
                resolvedPath: useElevated ? m.elevated_path : m.path,
            };
        })
        .filter((m) => !!m.resolvedPath);

    if (!isLoaded || modulesLoading) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={22} />
            </Box>
        );
    }

    if (visibleModules.length === 0) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ textAlign: "center", maxWidth: 380 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Giriş icazəniz yoxdur
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Hesabınıza heç bir modula giriş icazəsi verilməyib. Zəhmət olmasa sistem administratoru ilə əlaqə saxlayın.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 3, md: 6 }, maxWidth: 1200, mx: "auto", minHeight: "100vh" }}>
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 800, letterSpacing: "-1px" }}>
                Risk Reyestri Sistemi
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 6 }}>
                Sistemi idarə etmək üçün aşağıdakı modullardan birini seçin.
            </Typography>

            <Grid container spacing={4}>
                {visibleModules.map((module) => {
                    const iconConf = ICON_MAP[module.permission] || DEFAULT_ICON;
                    return (
                        <Grid item xs={12} sm={6} md={4} key={module.title}>
                            <Link href={module.resolvedPath} style={{ textDecoration: 'none' }}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 4, borderRadius: 4, border: "1px solid", borderColor: "divider",
                                        height: "100%", transition: "all 0.3s ease", display: "flex",
                                        flexDirection: "column", gap: 2,
                                        "&:hover": { borderColor: "primary.main", boxShadow: "0 10px 30px rgba(0,0,0,0.08)", transform: "translateY(-8px)" }
                                    }}
                                >
                                    <Box sx={{
                                        width: 70, height: 70, borderRadius: 3,
                                        backgroundColor: iconConf.color, color: iconConf.iconColor,
                                        display: "flex", alignItems: "center", justifyContent: "center", mb: 1
                                    }}>
                                        {iconConf.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                            {module.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {module.title} moduluna keçid etmək üçün bura klikləyin.
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Link>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}