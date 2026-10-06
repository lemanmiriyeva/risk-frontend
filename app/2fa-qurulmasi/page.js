"use client"
import React, {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {handleError} from "@/app/utils";
import {BRAND, C} from "@/components/theme/tokens";
import AuthLayout, {AuthError, FieldLabel, SupportNote, authFieldSx, authPrimaryButtonSx} from "@/components/shell/AuthLayout";

function hasAnyModuleAccess(permissions = []) {
    return Array.isArray(permissions) && permissions.length > 0;
}

function Step({n, title, children}) {
    return (
        <Box sx={{display: 'flex', gap: 1.75, mb: 3}}>
            <Box sx={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0, mt: 0.1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: BRAND.navy900, color: '#fff', fontSize: 13, fontWeight: 700,
            }}>
                {n}
            </Box>
            <Box sx={{flex: 1, minWidth: 0}}>
                <Typography sx={{fontSize: 14.5, fontWeight: 650, color: C.ink, mb: 1}}>{title}</Typography>
                {children}
            </Box>
        </Box>
    );
}

export default function Page() {
    const [qrCode, setQrCode] = useState(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.TWO_FA_SETUP);
                if (res.data?.qr_code) {
                    setQrCode(res.data.qr_code);
                } else if (res.data?.detail) {
                    const {is_approved, permissions = []} = res.data;
                    if (is_approved && hasAnyModuleAccess(permissions)) {
                        router.push(APP_ROUTES.HOME);
                    } else {
                        router.push(APP_ROUTES.PENDING_APPROVAL);
                    }
                }
            } catch (e) {
                setError(handleError(e));
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVerify = async (event) => {
        event.preventDefault();
        setVerifying(true);
        setError(null);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TWO_FA_VERIFY, {code});
            enqueueSnackbar('2FA uğurla təsdiqləndi.', {variant: 'success'});

            const {is_approved, permissions = []} = res.data;

            if (is_approved && hasAnyModuleAccess(permissions)) {
                router.push(APP_ROUTES.HOME);
            } else {
                router.push(APP_ROUTES.PENDING_APPROVAL);
            }
        } catch (e) {
            const msg = e?.response?.data?.detail || handleError(e);
            setError(msg);
            setCode('');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <AuthLayout
            icon={<QrCode2OutlinedIcon/>}
            title="İki mərhələli doğrulamanın qurulması"
            subtitle="Hesabınızın təhlükəsizliyi üçün iki mərhələli doğrulama (2FA) məcburidir. Bu, yalnız bir dəfə edilir."
            maxWidth={480}
            footer={<SupportNote/>}
        >
            {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                    <CircularProgress size={28} sx={{color: BRAND.accent}}/>
                </Box>
            ) : (
                <>
                    <Step n={1} title="QR kodu skan edin">
                        <Typography sx={{fontSize: 13, color: C.inkMuted, lineHeight: 1.6, mb: 1.5}}>
                            Telefonunuzda Google Authenticator və ya Microsoft Authenticator tətbiqini açın və
                            aşağıdakı kodu skan edin. Tətbiqdə hesab «MİS» adı ilə görünəcək.
                        </Typography>
                        {qrCode ? (
                            <Box sx={{
                                display: 'inline-flex', p: 1.5, borderRadius: '14px',
                                border: `1px solid ${C.line}`, backgroundColor: '#fff',
                                boxShadow: '0 6px 18px rgba(10,27,54,0.06)',
                            }}>
                                <img src={qrCode} alt="2FA QR kod" style={{width: 184, height: 184, display: 'block'}}/>
                            </Box>
                        ) : (
                            <Typography sx={{fontSize: 13, color: C.inkFaint}}>QR kod yüklənmədi.</Typography>
                        )}
                    </Step>

                    <Step n={2} title="Tətbiqdəki kodu daxil edin">
                        <Box component="form" onSubmit={handleVerify} noValidate>
                            <FieldLabel htmlFor="code">6 rəqəmli kod</FieldLabel>
                            <TextField
                                fullWidth
                                required
                                id="code"
                                placeholder="000000"
                                autoComplete="one-time-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                disabled={verifying}
                                error={!!error}
                                inputProps={{
                                    inputMode: 'numeric', maxLength: 6,
                                    style: {letterSpacing: 12, textAlign: 'center', fontSize: 24, fontWeight: 700},
                                }}
                                sx={{...authFieldSx, mb: 2.5}}
                            />

                            <AuthError>{error}</AuthError>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={verifying || code.length < 6}
                                endIcon={verifying ? null : <ArrowForwardIcon/>}
                                sx={authPrimaryButtonSx}
                            >
                                {verifying
                                    ? <><CircularProgress size={18} sx={{color: '#fff', mr: 1.25}}/>Yoxlanılır…</>
                                    : 'Təsdiqlə'}
                            </Button>
                        </Box>
                    </Step>
                </>
            )}
        </AuthLayout>
    );
}