"use client"
import Link from "next/link";
import { useEffect, useState } from "react";
import { Grid, Typography, Box, Paper, CircularProgress, Chip } from "@mui/material";
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { service_api } from "@/app/service";
import { NEXT_API_ENDPOINTS } from "@/app/urls";

const ICON_MAP = {
    "risk": { icon: <SecurityIcon sx={{ fontSize: 32 }} />, gradient: "linear-gradient(135deg, #1976d2 0%, #4dabf5 100%)" },
    "risk-logs": { icon: <DescriptionIcon sx={{ fontSize: 32 }} />, gradient: "linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)" },
};
const DEFAULT_ICON = { icon: <ViewModuleIcon sx={{ fontSize: 32 }} />, gradient: "linear-gradient(135deg, #374151 0%, #6b7280 100%)" };

function getIconConf(urlEndpoint) {
    return ICON_MAP[urlEndpoint] || DEFAULT_ICON;
}

export default function Home() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.MODULES);
                setModules(res.data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const accessibleModules = modules.filter((m) => !!m.url_endpoint);
    const lockedModules = modules.filter((m) => !m.url_endpoint);

    if (loading) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={22} />
            </Box>
        );
    }

    if (accessibleModules.length === 0) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ textAlign: "center", maxWidth: 380 }}>
                    <LockOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
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
        <Box sx={{ p: { xs: 2.5, sm: 4, md: 6 }, maxWidth: {xs: '100%', sm: '92%', lg: 1400}, mx: "auto", minHeight: "100vh" }}>
            <Typography variant="h3" sx={{ mb: 1, fontWeight: 800, letterSpacing: "-1px", fontSize: {xs: 26, sm: 36, md: 48} }}>
                Mərkəzləşdirilmiş İnformasiya Sistemi
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: {xs: 4, md: 6} }}>
                Sistemi idarə etmək üçün aşağıdakı modullardan birini seçin.
            </Typography>

            <Grid container spacing={{xs: 2.5, sm: 3, md: 4}}>
                {accessibleModules.map((module) => {
                    const iconConf = getIconConf(module.url_endpoint);
                    const subModules = module.sub_modules || [];

                    return (
                        <Grid item xs={12} sm={6} md={4} key={module.id}>
                            <Paper
                                elevation={0}
                                sx={{
                                    position: "relative",
                                    borderRadius: 4,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    height: "100%",
                                    overflow: "hidden",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        borderColor: "transparent",
                                        boxShadow: "0 16px 40px rgba(0,0,0,0.1)",
                                        transform: "translateY(-6px)",
                                    },
                                }}
                            >
                                <Link href={`/${module.url_endpoint}`} style={{ textDecoration: "none", color: "inherit" }}>
                                    <Box
                                        sx={{
                                            height: 90,
                                            background: iconConf.gradient,
                                            display: "flex",
                                            alignItems: "center",
                                            px: 3,
                                            position: "relative",
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 2.5,
                                                backgroundColor: "rgba(255,255,255,0.2)",
                                                backdropFilter: "blur(4px)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#fff",
                                            }}
                                        >
                                            {iconConf.icon}
                                        </Box>
                                        <ArrowForwardIcon
                                            sx={{
                                                position: "absolute",
                                                right: 20,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: "rgba(255,255,255,0.7)",
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}>
                                            {module.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: subModules.length ? 2 : 0 }}>
                                            {module.description || `${module.title} moduluna keçid etmək üçün klikləyin.`}
                                        </Typography>
                                    </Box>
                                </Link>

                                {subModules.length > 0 && (
                                    <Box sx={{ px: 3, pb: 2.5, display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {subModules.map((sub) => (
                                            <Link key={sub.id} href={`/${module.url_endpoint}/${sub.url_endpoint}`} style={{ textDecoration: "none" }}>
                                                <Chip
                                                    label={sub.title}
                                                    size="small"
                                                    clickable
                                                    sx={{
                                                        fontWeight: 500,
                                                        "&:hover": { backgroundColor: "action.selected" },
                                                    }}
                                                />
                                            </Link>
                                        ))}
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>


        </Box>
    );
}