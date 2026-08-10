"use client"
import Link from "next/link";
import { useEffect, useState } from "react";
import { Grid, Typography, Box, Paper, CircularProgress, Chip } from "@mui/material";
import SecurityIcon from '@mui/icons-material/Security';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import { service_api } from "@/app/service";
import { NEXT_API_ENDPOINTS } from "@/app/urls";
import { GOV } from "@/components/theme/govColors";

const ICON_MAP = {
    "risk": <SecurityIcon sx={{ fontSize: 26 }} />,
    "risk-logs": <DescriptionIcon sx={{ fontSize: 26 }} />,
    "logs": <HistoryIcon sx={{ fontSize: 26 }} />,
    "emeliyyatlar": <FactCheckOutlinedIcon sx={{ fontSize: 26 }} />,
};
const DEFAULT_ICON = <ViewModuleIcon sx={{ fontSize: 26 }} />;

function getIcon(urlEndpoint) {
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

    if (loading) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={22} sx={{ color: GOV.navy }} />
            </Box>
        );
    }

    if (accessibleModules.length === 0) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: GOV.pageBg }}>
                <Box sx={{ textAlign: "center", maxWidth: 380 }}>
                    <LockOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: GOV.textPrimary }}>
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
        <Box sx={{ backgroundColor: GOV.pageBg, minHeight: "100vh" }}>
            <Box
                sx={{
                    position: "relative",
                    background: `linear-gradient(135deg, ${GOV.navy} 0%, ${GOV.navyMid} 55%, ${GOV.navySoft} 100%)`,
                    overflow: "hidden",
                    borderBottom: `3px solid ${GOV.gold}`,
                }}
            >
                <Box
                    aria-hidden
                    sx={{
                        position: "absolute",
                        inset: 0,
                        opacity: 0.6,
                        backgroundImage: `radial-gradient(circle at 88% 15%, rgba(201,162,75,0.18) 0%, rgba(201,162,75,0) 45%),
                                           radial-gradient(circle at 5% 100%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%)`,
                        pointerEvents: "none",
                    }}
                />
                <Box
                    aria-hidden
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: { xs: "60%", md: "38%" },
                        opacity: 0.05,
                        pointerEvents: "none",
                        backgroundImage: "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 26px)",
                    }}
                />
                <Box
                    sx={{
                        position: "relative",
                        zIndex: 1,
                        px: { xs: 2.5, sm: 4, md: 6 },
                        pt: { xs: 4, sm: 5, md: 6.5 },
                        pb: { xs: 4, sm: 5, md: 6 },
                        maxWidth: { xs: "100%", sm: "92%", lg: 1400 },
                        mx: "auto",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                            sx={{
                                width: { xs: 48, sm: 56 },
                                height: { xs: 48, sm: 56 },
                                borderRadius: 2,
                                display: { xs: "none", sm: "flex" },
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(201,162,75,0.14)",
                                border: "1px solid rgba(201,162,75,0.35)",
                                color: GOV.gold,
                                flexShrink: 0,
                            }}
                        >
                            <AccountBalanceOutlinedIcon sx={{ fontSize: 28 }} />
                        </Box>
                        <Box>
                            <Typography
                                sx={{
                                    color: GOV.gold,
                                    letterSpacing: 3,
                                    fontSize: { xs: 11, sm: 12 },
                                    fontWeight: 700,
                                    mb: 0.5,
                                    textTransform: "uppercase",
                                }}
                            >
                                Rəsmi İnformasiya Sistemi
                            </Typography>
                            <Typography
                                sx={{
                                    color: GOV.textOnNavy,
                                    fontWeight: 800,
                                    letterSpacing: "-0.5px",
                                    fontSize: { xs: 24, sm: 32, md: 42 },
                                    lineHeight: 1.15,
                                }}
                            >
                                Mərkəzləşdirilmiş İnformasiya Sistemi
                            </Typography>
                            <Typography
                                sx={{
                                    color: GOV.textOnNavyMuted,
                                    fontSize: { xs: 13.5, sm: 15 },
                                    mt: 0.75,
                                    maxWidth: 620,
                                }}
                            >
                                Sistemi idarə etmək üçün aşağıdakı modullardan birini seçin.
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ p: { xs: 2.5, sm: 4, md: 6 }, maxWidth: { xs: '100%', sm: '92%', lg: 1400 }, mx: "auto" }}>
                <Grid container spacing={{ xs: 2.5, sm: 3, md: 3.5 }}>
                    {accessibleModules.map((module) => {
                        const subModules = module.sub_modules || [];

                        return (
                            <Grid item xs={12} sm={6} md={4} key={module.id}>
                                <Link href={`/${module.url_endpoint}`} style={{ textDecoration: "none", color: "inherit" }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            position: "relative",
                                            borderRadius: 3,
                                            border: "1px solid",
                                            borderColor: GOV.cardBorder,
                                            borderTop: `3px solid ${GOV.navy}`,
                                            height: "100%",
                                            overflow: "hidden",
                                            backgroundColor: "#fff",
                                            transition: "all 0.25s ease",
                                            "&:hover": {
                                                borderTopColor: GOV.gold,
                                                boxShadow: "0 14px 34px rgba(2,6,36,0.12)",
                                                transform: "translateY(-4px)",
                                            },
                                            "&:hover .module-arrow": {
                                                backgroundColor: GOV.navy,
                                                color: GOV.gold,
                                                transform: "translateX(2px)",
                                            },
                                        }}
                                    >
                                        <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                                            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 52,
                                                        height: 52,
                                                        borderRadius: 2,
                                                        backgroundColor: GOV.navy,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: GOV.gold,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {getIcon(module.url_endpoint)}
                                                </Box>
                                                <Box
                                                    className="module-arrow"
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: "50%",
                                                        backgroundColor: GOV.pageBg,
                                                        color: GOV.textMuted,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        transition: "all 0.25s ease",
                                                    }}
                                                >
                                                    <ArrowForwardIcon sx={{ fontSize: 17 }} />
                                                </Box>
                                            </Box>

                                            <Typography sx={{ fontWeight: 700, mb: 0.5, color: GOV.textPrimary, fontSize: 17 }}>
                                                {module.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: GOV.textMuted, mb: subModules.length ? 2 : 0, flexGrow: 1 }}>
                                                {module.description || `${module.title} moduluna keçid etmək üçün klikləyin.`}
                                            </Typography>

                                            {subModules.length > 0 && (
                                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, pt: 1.5, mt: "auto", borderTop: `1px solid ${GOV.cardBorder}` }}>
                                                    {subModules.map((sub) => (
                                                        <Chip
                                                            key={sub.id}
                                                            label={sub.title}
                                                            size="small"
                                                            sx={{
                                                                fontWeight: 500,
                                                                fontSize: 12,
                                                                color: GOV.navySoft,
                                                                backgroundColor: "transparent",
                                                                border: `1px solid ${GOV.cardBorder}`,
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                </Link>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        </Box>
    );
}