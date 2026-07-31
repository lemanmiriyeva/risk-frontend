"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Typography, Grid, Paper, CircularProgress, Chip } from "@mui/material";
import ListAltIcon from '@mui/icons-material/ListAlt';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { service_api } from "@/app/service";
import { NEXT_API_ENDPOINTS } from "@/app/urls";

const SUB_ICON_MAP = {
    "list": <ListAltIcon sx={{ fontSize: 28 }} />,
    "table": <TableChartOutlinedIcon sx={{ fontSize: 28 }} />,
    "logs": <DescriptionIcon sx={{ fontSize: 28 }} />,
};

export default function Page() {
    const [riskModule, setRiskModule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.CORE.MODULES);
                const modules = res.data || [];
                const risk = modules.find((m) => m.url_endpoint === "risk");
                setRiskModule(risk || null);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={22} />
            </Box>
        );
    }

    const subModules = riskModule?.sub_modules || [];

    if (!riskModule || subModules.length === 0) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ textAlign: "center", maxWidth: 380 }}>
                    <LockOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Giriş icazəniz yoxdur
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Risk modulunda heç bir alt-bölməyə icazəniz yoxdur. Sistem administratoru ilə əlaqə saxlayın.
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2.5, sm: 4, md: 6 }, maxWidth: {xs: '100%', sm: '92%', lg: 1400}, mx: "auto", minHeight: "100vh" }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 800, fontSize: {xs: 24, sm: 28, md: 34} }}>
                {riskModule.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: {xs: 3, md: 5} }}>
                Davam etmək üçün aşağıdakı bölmələrdən birini seçin.
            </Typography>

            <Grid container spacing={{xs: 2, sm: 2.5, md: 3}}>
                {subModules.map((sub) => (
                    <Grid item xs={12} sm={6} md={4} key={sub.id}>
                        <Link
                            href={`/${riskModule.url_endpoint}/${sub.url_endpoint}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                                        transform: "translateY(-3px)",
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 48, height: 48, borderRadius: 2,
                                        backgroundColor: "action.hover",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    {SUB_ICON_MAP[sub.url_endpoint] || <ListAltIcon sx={{ fontSize: 28 }} />}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 600 }}>{sub.title}</Typography>
                                    {sub.description && (
                                        <Typography variant="body2" color="text.secondary">
                                            {sub.description}
                                        </Typography>
                                    )}
                                </Box>
                                <ArrowForwardIcon sx={{ color: "text.disabled", fontSize: 20 }} />
                            </Paper>
                        </Link>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}