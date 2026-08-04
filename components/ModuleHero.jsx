"use client"
import Link from "next/link";
import { Box, Typography, Breadcrumbs } from "@mui/material";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { GOV } from "@/components/theme/govColors";

/**
 * Modul səhifələri üçün rəsmi başlıq bloku (hero banner).
 * Rəng tonu naviqasiya panelindəki tünd-lacivərd fonla eynidir ki,
 * səhifələr arası keçid vizual olaraq kəsilməsin.
 */
export default function ModuleHero({ eyebrow, title, subtitle, breadcrumb, icon }) {
    return (
        <Box
            sx={{
                position: "relative",
                background: `linear-gradient(135deg, ${GOV.navy} 0%, ${GOV.navyMid} 55%, ${GOV.navySoft} 100%)`,
                overflow: "hidden",
                borderBottom: `3px solid ${GOV.gold}`,
            }}
        >
            {/* Dekorativ rəsmi naxış */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.5,
                    backgroundImage: `radial-gradient(circle at 85% 20%, rgba(201,162,75,0.16) 0%, rgba(201,162,75,0) 45%),
                                       radial-gradient(circle at 10% 100%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%)`,
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
                    width: { xs: "60%", md: "40%" },
                    opacity: 0.06,
                    pointerEvents: "none",
                    backgroundImage: "repeating-linear-gradient(135deg, #fff 0px, #fff 1px, transparent 1px, transparent 26px)",
                }}
            />

            <Box
                sx={{
                    position: "relative",
                    zIndex: 1,
                    px: { xs: 2.5, sm: 4, md: 6 },
                    pt: { xs: 3.5, sm: 4.5, md: 5.5 },
                    pb: { xs: 3.5, sm: 4.5, md: 5.5 },
                    maxWidth: { xs: "100%", sm: "92%", lg: 1400 },
                    mx: "auto",
                }}
            >
                {breadcrumb && breadcrumb.length > 0 && (
                    <Breadcrumbs
                        separator={<NavigateNextIcon sx={{ fontSize: 16, color: GOV.textOnNavyMuted }} />}
                        sx={{ mb: 2 }}
                    >
                        <Link href="/" style={{ textDecoration: "none" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: GOV.textOnNavyMuted, "&:hover": { color: GOV.gold } }}>
                                <HomeOutlinedIcon sx={{ fontSize: 16 }} />
                                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Modullar</Typography>
                            </Box>
                        </Link>
                        {breadcrumb.map((b, i) => (
                            <Typography key={i} sx={{ fontSize: 13, fontWeight: 500, color: GOV.textOnNavy }}>
                                {b}
                            </Typography>
                        ))}
                    </Breadcrumbs>
                )}

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {icon && (
                        <Box
                            sx={{
                                width: { xs: 44, sm: 52 },
                                height: { xs: 44, sm: 52 },
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                backgroundColor: "rgba(201,162,75,0.14)",
                                border: `1px solid rgba(201,162,75,0.35)`,
                                color: GOV.gold,
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                    <Box>
                        {eyebrow && (
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
                                {eyebrow}
                            </Typography>
                        )}
                        <Typography
                            sx={{
                                color: GOV.textOnNavy,
                                fontWeight: 800,
                                letterSpacing: "-0.5px",
                                fontSize: { xs: 22, sm: 28, md: 34 },
                                lineHeight: 1.15,
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography
                                sx={{
                                    color: GOV.textOnNavyMuted,
                                    fontSize: { xs: 13.5, sm: 15 },
                                    mt: 0.75,
                                    maxWidth: 640,
                                }}
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}