"use client"
import {Box, Grid, Typography} from "@mui/material";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import {BRAND, C} from "@/components/theme/tokens";
import {reveal} from "@/components/theme/motion";
import {useUserModules} from "@/components/shell/moduleMeta";
import HomeCalendar from "@/components/home/HomeCalendar";
import HomeFeed from "@/components/home/HomeFeed";
import ModuleCards from "@/components/home/ModuleCards";
import HomeQuickLinks from "@/components/home/HomeQuickLinks";

// Yuxarıdakı sürətli sırada göstərilən modullar digər modullar şəbəkəsində təkrarlanmır
const QUICK_ENDPOINTS = ['emeliyyatlar', 'muracietler'];

const wrapSx = {px: {xs: 2.5, sm: 4, md: 6}, maxWidth: {xs: '100%', sm: '94%', lg: 1440}, mx: 'auto'};

export default function Home() {
    const {modules, loading} = useUserModules();
    const hasOperations = modules.some((m) => m.url_endpoint === 'emeliyyatlar');
    const hasSupport = modules.some((m) => m.url_endpoint === 'muracietler');
    const otherModules = modules.filter((m) => !QUICK_ENDPOINTS.includes(m.url_endpoint));

    if (!loading && modules.length === 0) {
        return (
            <Box sx={{minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3}}>
                <Box sx={{textAlign: 'center', maxWidth: 440, ...reveal(0)}}>
                    <Box sx={{width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${C.lineStrong}`, color: C.inkMuted}}>
                        <LockOutlinedIcon sx={{fontSize: 30}}/>
                    </Box>
                    <Typography sx={{fontSize: 24, fontWeight: 600, color: BRAND.navy900, mb: 1}}>Giriş icazəniz yoxdur</Typography>
                    <Typography sx={{fontSize: 14.5, color: C.inkMuted, lineHeight: 1.6}}>
                        Hesabınıza heç bir modula giriş icazəsi verilməyib. Zəhmət olmasa sistem administratoru ilə əlaqə saxlayın.
                    </Typography>
                </Box>
            </Box>
        );
    }

    // 3:1 - solda modullar (3 hissə), sağda təqvim + elanlar (1 hissə)
    return (
        <Box sx={{pb: 8, pt: {xs: 3, md: 4}}}>
            <Box sx={wrapSx}>
                <Grid container spacing={2.5} alignItems="flex-start">
                    <Grid item xs={12} md={9}>
                        {!loading && <HomeQuickLinks hasOperations={hasOperations} hasSupport={hasSupport}/>}
                        <ModuleCards modules={otherModules} loading={loading}/>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2.5}}>
                            <HomeCalendar/>
                            <HomeFeed/>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
