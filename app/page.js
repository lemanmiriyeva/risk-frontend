"use client"
import Link from "next/link";
import { Grid, Typography, Box, Paper, Stack, CircularProgress } from "@mui/material";
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useAppSelector } from "@/lib/hooks";

const ALL_MODULES = [
    { title: "Risk Reyestri Cədvəli", path: "/risk", icon: <SecurityIcon sx={{ fontSize: 40 }} />, color: "#e3f2fd", iconColor: "#1976d2", permission: "risk.view_risk" },
    { title: "Risk Reyestri Loqları", path: "/risk/loqlar", icon: <AssignmentIcon sx={{ fontSize: 40 }} />, color: "#e8f5e9", iconColor: "#2e7d32", permission: "risk.view_risklog" },
];

export default function Home() {
    const userState = useAppSelector((state) => state.user);
    const isLoaded = userState?.isLoaded;
    const permissions = userState?.permissions || [];

    const modules = ALL_MODULES.filter((m) => permissions.includes(m.permission));

    if (!isLoaded) {
        return (
            <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={22} />
            </Box>
        );
    }

    if (modules.length === 0) {
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
                {modules.map((module) => (
                    <Grid item xs={12} sm={6} md={4} key={module.title}>
                        <Link href={module.path} style={{ textDecoration: 'none' }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    borderRadius: 4,
                                    border: "1px solid",
                                    borderColor: "divider",
                                    height: "100%",
                                    transition: "all 0.3s ease",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                    "&:hover": {
                                        borderColor: "primary.main",
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                                        transform: "translateY(-8px)",
                                    }
                                }}
                            >
                                <Box sx={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: 3,
                                    backgroundColor: module.color,
                                    color: module.iconColor,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 1
                                }}>
                                    {module.icon}
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
                ))}
            </Grid>
        </Box>
    );
}