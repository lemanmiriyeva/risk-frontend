"use client"
import React, {Suspense, useEffect, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from "@mui/material/CircularProgress";
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import {useRouter, useSearchParams} from "next/navigation";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {handleError} from "@/app/utils";
import AuthLayout, {authPrimaryButtonSx} from "@/components/shell/AuthLayout";

/** E-poçtdakı QR oxunanda bu səhifə açılır: tokeni təsdiq edir, 2FA sıfırlanır, giriş səhifəsinə yönləndirir. */
function ResetConfirm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [error, setError] = useState(token ? null : 'QR kod etibarsızdır. Giriş səhifəsində yenidən sorğu göndərin.');
    const started = useRef(false);

    useEffect(() => {
        if (!token || started.current) return;
        started.current = true;   // token birdəfəlikdir: təkrar çağırış olmasın
        service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TWO_FA_RESET_CONFIRM, {token})
            .then(() => router.replace(`${APP_ROUTES.SIGNIN}?two_fa_reset=ok`))
            .catch((e) => setError(handleError(e)));
    }, [token, router]);

    return (
        <AuthLayout
            icon={<VerifiedUserOutlinedIcon/>}
            title="2FA sıfırlanır"
            subtitle="QR kod yoxlanılır"
        >
            {error ? (
                <>
                    <Typography sx={{mb: 3, lineHeight: 1.6}}>{error}</Typography>
                    <Button fullWidth variant="contained" sx={authPrimaryButtonSx}
                            onClick={() => router.replace(APP_ROUTES.SIGNIN)}>
                        Giriş səhifəsinə keç
                    </Button>
                </>
            ) : (
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2, py: 2}}>
                    <CircularProgress size={22}/>
                    <Typography>Zəhmət olmasa gözləyin…</Typography>
                </Box>
            )}
        </AuthLayout>
    );
}

export default function Page() {
    return <Suspense fallback={null}><ResetConfirm/></Suspense>;
}
