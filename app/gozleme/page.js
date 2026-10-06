"use client"
import React, {useEffect, useState, useCallback} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import {useRouter} from "next/navigation";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {BRAND, C} from "@/components/theme/tokens";
import AuthLayout, {SupportNote} from "@/components/shell/AuthLayout";

const CHECK_INTERVAL_MS = 10000; // hər 10 saniyədə bir yoxla

export default function Page() {
    const router = useRouter();
    const [checking, setChecking] = useState(false);

    const checkAccess = useCallback(async () => {
        setChecking(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER);
            const {is_approved, permissions = []} = res.data || {};
            if (is_approved && Array.isArray(permissions) && permissions.length > 0) {
                router.push(APP_ROUTES.HOME);
            }
        } catch (e) {
            // sükutla keç, növbəti interval-da yenidən cəhd olunacaq
        } finally {
            setChecking(false);
        }
    }, [router]);

    useEffect(() => {
        checkAccess();
        const interval = setInterval(checkAccess, CHECK_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [checkAccess]);

    return (
        <AuthLayout
            align="center"
            icon={<HourglassEmptyOutlinedIcon/>}
            title="Giriş icazəsi gözlənilir"
            subtitle="İki mərhələli doğrulama uğurla tamamlandı. Hesabınıza modul icazələri verildikdən sonra sistemə avtomatik yönləndiriləcəksiniz."
            footer={<SupportNote>İcazə gecikirsə, İnformasiya texnologiyaları şöbəsinə müraciət edin:</SupportNote>}
        >
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25, mb: 3,
                px: 2, py: 1.25, borderRadius: '10px', backgroundColor: C.surfaceRaised, border: `1px solid ${C.line}`,
            }}>
                <CircularProgress size={14} sx={{color: BRAND.accent, opacity: checking ? 1 : 0.4}}/>
                <Typography sx={{fontSize: 13, color: C.inkMuted}}>
                    İcazə statusu avtomatik yoxlanılır…
                </Typography>
            </Box>

            <Button
                onClick={() => router.push(APP_ROUTES.SIGNIN)}
                fullWidth
                variant="outlined"
                sx={{
                    py: 1.4, borderRadius: '10px', fontWeight: 650,
                    borderColor: C.lineStrong, color: BRAND.navy900,
                    '&:hover': {borderColor: BRAND.navy900, backgroundColor: 'rgba(10,27,54,0.03)'},
                }}
            >
                Giriş səhifəsinə qayıt
            </Button>
        </AuthLayout>
    );
}