"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import ListAltIcon from '@mui/icons-material/ListAlt';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SecurityIcon from '@mui/icons-material/Security';
import { service_api } from "@/app/service";
import { NEXT_API_ENDPOINTS } from "@/app/urls";
import { GOV } from "@/components/theme/govColors";
import ModuleHero from "@/components/ModuleHero";

const SUB_ICON_MAP = {
    "list": <ListAltIcon sx={{ fontSize: 24 }} />,
    "table": <TableChartOutlinedIcon sx={{ fontSize: 24 }} />,
    "logs": <DescriptionIcon sx={{ fontSize: 24 }} />,
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
                <CircularProgress size={22} sx={{ color: GOV.navy }} />
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
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <ModuleHero
                eyebrow="Modul"
                title={riskModule.title}
                subtitle="Davam etmək üçün aşağıdakı bölmələrdən birini seçin."
                breadcrumb={[riskModule.title]}
                icon={<SecurityIcon sx={{ fontSize: 26 }} />}
            />

            <Box sx={{ p: { xs: 2.5, sm: 4, md: 6 }, maxWidth: { xs: '100%', sm: '92%', lg: 1400 }, mx: "auto" }}>
                <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} >
                    {subModules.map((sub) => (
                        <Grid item xs={12} sm={6} md={4} key={sub.id}>
                            <Link
                                href={`/${riskModule.url_endpoint}/${sub.url_endpoint}`}
                                style={{ textDecoration: "none", color: "inherit" }}
                            >
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.75,
                                        borderRadius: 2.5,
                                        border: "1px solid",
                                        borderColor: GOV.cardBorder,
                                        borderLeft: `3px solid ${GOV.navy}`,
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        backgroundColor: "#fff",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                            borderLeftColor: GOV.gold,
                                            boxShadow: "0 10px 26px rgba(2,6,36,0.10)",
                                            transform: "translateY(-3px)",
                                        },
                                        "&:hover .sub-arrow": {
                                            color: GOV.gold,
                                            transform: "translateX(3px)",
                                        },
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 46, height: 46, borderRadius: 2,
                                            backgroundColor: GOV.navy,
                                            color: GOV.gold,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {SUB_ICON_MAP[sub.url_endpoint] || <ListAltIcon sx={{ fontSize: 24 }} />}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{ fontWeight: 700, color: GOV.textPrimary, fontSize: 15.5 }}>
                                            {sub.title}
                                        </Typography>
                                        {sub.description && (
                                            <Typography variant="body2" sx={{ color: GOV.textMuted }}>
                                                {sub.description}
                                            </Typography>
                                        )}
                                    </Box>
                                    <ArrowForwardIcon
                                        className="sub-arrow"
                                        sx={{ color: GOV.textMuted, fontSize: 19, transition: "all 0.2s ease", flexShrink: 0 }}
                                    />
                                </Paper>
                            </Link>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    );
}