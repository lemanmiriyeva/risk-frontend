"use client"
import React, {useState, useEffect} from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {useRouter, useSearchParams} from "next/navigation";
import {handleError, isEmpty} from "@/app/utils";
import {useAppDispatch} from "@/lib/hooks";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import PasswordReset from "@/app/daxilol/ResetPassword";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import bina from "@/app/msn_bina.png"
import logo from "@/app/logo.svg"

import Image from "next/image";


function BrandMark() {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5,zIndex:"10"}}>
            <Image src={logo} alt={""}/>

        </Box>
    );
}

function BuildingBlueprint() {
    return (
        <Box
            sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                opacity: 1,
                pointerEvents: 'none',
                '& img': {
                    width: '100%',
                    height: '100%',
                }
            }}
        >
            <div style={{position:"absolute",backgroundColor:"rgba(0,0,0,0.7)",zIndex:1,width:"100%",height:"100%"}}>

            </div>
            <Image
                className={"building"}
                src={bina}
                alt="Bina təsviri"
                layout="responsive"
                width={"100%"}
                height={"100%"}
                style={{height:"100%"}}
            />
        </Box>
    );
}

// ---------------------------------------------------------------------------

export default function Page() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [errors, setErrors] = useState({username: null, password: null, common: null})
    const [showPasswordReset, setShowPasswordReset] = useState(false)
    const [capsLockOn, setCapsLockOn] = React.useState(false);
    // 2FA - şifrə doğrulandıqdan sonra kod addımı
    const [twoFaStep, setTwoFaStep] = useState(false);
    const [pendingCredentials, setPendingCredentials] = useState(null);
    const [code, setCode] = useState('');
    // user store
    const dispatch = useAppDispatch()
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const router = useRouter();
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [urlUserId, setUrlUserId] = useState(null);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            setUrlUserId(id);
            setShowForgotModal(true);

            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }
    }, [searchParams]);

    const performLogin = async (payload) => {
        setLoading(true)
        try {
            const response = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.SIGNIN, payload)
            // Bura yalnız status 2xx olduqda çatır - giriş tam tamamlanıb
            enqueueSnackbar('Giriş uğurludur.', {variant: 'success', autoHideDuration: 500})

            const user_res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER)
            const user = await user_res.data
            if (!isEmpty(user)) {
                if (!user.two_fa_confirmed) {
                    router.push(APP_ROUTES.TWO_FA_SETUP)
                } else if (!user.is_approved) {          // ⬅️ BURA
                    router.push(APP_ROUTES.PENDING_APPROVAL)
                } else {
                    router.push(APP_ROUTES.HOME)
                }
            } else {
                enqueueSnackbar('İstifadəçi yoxdur!', {variant: 'error', autoHideDuration: 4000})
            }
        } catch (error) {
            console.log(error)
            if (error?.response?.status === 401 && error?.response?.data?.two_fa_required) {
                // Şifrə düzgündür, indi autentifikasiya tətbiqindəki kod tələb olunur
                setTwoFaStep(true)
                setErrors({username: null, password: null, common: null})
            } else {
                const msg = error?.response?.data?.detail || handleError(error);
                setErrors((errors) => ({...errors, common: msg}));
                enqueueSnackbar(msg, {variant: 'error', autoHideDuration: 5000});
                if (twoFaStep) setCode('')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({username: null, password: null, common: null})

        if (!twoFaStep) {
            const data = new FormData(event.currentTarget);
            const cr = {
                username: data.get('username'), password: data.get('password'),
            }

            if (!cr.username) setErrors((errors) => ({...errors, username: 'İstifadəçi adı boş ola bilməz'}))
            if (!cr.password) setErrors((errors) => ({...errors, password: 'Şifrə boş ola bilməz'}))
            if (!cr.username || !cr.password) return

            setPendingCredentials(cr)
            await performLogin(cr)
        } else {
            if (!code) {
                setErrors((errors) => ({...errors, common: 'Kodu daxil edin'}))
                return
            }
            await performLogin({...pendingCredentials, code})
        }
    };

    const handleBackToCredentials = () => {
        setTwoFaStep(false)
        setCode('')
        setErrors({username: null, password: null, common: null})
    }


    const handleCapsLock = (event) => {
        setCapsLockOn(event.getModifierState && event.getModifierState('CapsLock'));
    };

    async function handlePasswordReset(username) {
        setLoading(true)
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.REQUEST_RESET, {username})
            enqueueSnackbar('Elektron poçt ünvanınızı yoxlayın.', {variant: 'success'})
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'})
        } finally {
            setShowPasswordReset(false)
            setLoading(false)
        }
    }

    function handlePasswordResetDialog(e) {
        e.preventDefault()
        setShowPasswordReset(true)
    }

    function handleClose() {
        setShowPasswordReset(false)
    }

    function handleOpenDialog(e) {
        e.preventDefault()
        setShowForgotModal(true)
    }

    function handleCloseDialog(e) {
        setShowForgotModal(false)
        setUrlUserId(null);
    }

    return (
        <Box sx={{display: 'flex', minHeight: '100vh', width: '100%'}}>
            <CssBaseline/>

            {/* LEFT — brand panel */}
            <Box
                sx={{
                    position: 'relative',
                    flex: {xs: '0 0 0%', md: '0 0 52%'},
                    display: {xs: 'none', md: 'flex'},
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#0E1730',
                    color: '#E7EAF3',
                    overflow: 'hidden',
                    px: {md: 6, lg: 8},
                    py: 5,
                }}
            >
                <BrandMark/>

                <Box sx={{position: 'relative', zIndex: 10, mb: 4}}>
                    <Typography
                        sx={{
                            color: '#C9A24B',
                            letterSpacing: 4,
                            fontSize: 13,
                            fontWeight: 600,
                            mb: 1,
                        }}
                    >
                        MİS PLATFORMASI
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: {md: 48, lg: 64},
                            fontWeight: 800,
                            lineHeight: 1,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            mb: 2,
                        }}
                    >
                        Mərkəzləşdİrİlmİş İnformasİya Sİstemİ
                    </Typography>
                    <Typography sx={{color: '#9AA5C7', maxWidth: 440, fontSize: 15, lineHeight: 1.7}}>
                        Məlumatların vahid platformada təhlükəsiz və səmərəli idarə olunmasını təmin edən informasiya sistemi.
                    </Typography>
                </Box>

                <BuildingBlueprint/>
                <Box sx={{zIndex:10}}>

                </Box>
            </Box>

            {/* RIGHT — form panel */}
            <Box
                sx={{
                    flex: '1 1 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EEF1F5',
                    px: 3,
                    py: 6,
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 400,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 3,
                        boxShadow: '0 20px 45px rgba(15, 23, 55, 0.08)',
                        px: {xs: 3, sm: 5},
                        py: 5,
                    }}
                >
                    <Typography sx={{fontSize: 22, fontWeight: 700, color: '#111827', mb: 0.5}}>
                        {twoFaStep ? 'Autentifikasiya kodu' : 'Sistemə giriş'}
                    </Typography>
                    <Typography sx={{fontSize: 14, color: '#6B7280', mb: 3}}>
                        {twoFaStep
                            ? 'Autentifikasiya tətbiqinizdəki 6 rəqəmli kodu daxil edin.'
                            : 'Hesab məlumatlarınızı daxil edin.'}
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        {!twoFaStep ? (
                            <>
                                <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                                    İstifadəçi adı və ya elektron poçt
                                </Typography>
                                <TextField
                                    fullWidth
                                    required
                                    id="username"
                                    placeholder="İstifadəçi adı və ya elektron poçt"
                                    name="username"
                                    autoComplete="username"
                                    autoFocus
                                    size="small"
                                    error={!!errors.username}
                                    helperText={errors.username}
                                    disabled={loading}
                                    sx={{mb: 2}}
                                />

                                <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                                    Şifrə
                                </Typography>
                                <TextField
                                    fullWidth
                                    required
                                    size="small"
                                    onKeyDown={handleCapsLock}
                                    onKeyUp={handleCapsLock}
                                    error={!!errors.password}
                                    helperText={
                                        errors.password
                                            ? errors.password
                                            : capsLockOn
                                                ? "Caps Lock açıqdır"
                                                : ""
                                    }
                                    name="password"
                                    placeholder="Şifrə"
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    size="small"
                                                    disabled={loading}
                                                    onClick={handleClickShowPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 0.75, mb: 2.5}}>
                                    <Link
                                        onClick={handlePasswordResetDialog}
                                        component="button"
                                        type="button"
                                        underline="hover"
                                        sx={{fontSize: 13, color: '#4F5B92'}}
                                    >
                                        Şifrənizi unutmusunuz?
                                    </Link>
                                </Box>
                            </>
                        ) : (
                            <>
                                <TextField
                                    fullWidth
                                    required
                                    id="code"
                                    name="code"
                                    placeholder="000000"
                                    autoComplete="one-time-code"
                                    autoFocus
                                    size="small"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    error={!!errors.common}
                                    disabled={loading}
                                    inputProps={{inputMode: 'numeric', maxLength: 6, style: {letterSpacing: 4, textAlign: 'center', fontSize: 18}}}
                                    sx={{mb: 2}}
                                />

                                <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: -1, mb: 2.5}}>
                                    <Link
                                        onClick={handleBackToCredentials}
                                        component="button"
                                        type="button"
                                        underline="hover"
                                        sx={{fontSize: 13, color: '#4F5B92'}}
                                    >
                                        Geri qayıt
                                    </Link>
                                </Box>
                            </>
                        )}

                        {errors.common && (
                            <Typography sx={{fontSize: 13, color: '#D32F2F', mb: 2}}>
                                {errors.common}
                            </Typography>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                backgroundColor: '#141B33',
                                textTransform: 'none',
                                fontWeight: 600,
                                py: 1.1,
                                borderRadius: 1.5,
                                '&:hover': {backgroundColor: '#0B1024'},
                            }}
                        >
                            {loading ? 'Yoxlanılır…' : (twoFaStep ? 'Təsdiqlə' : 'Daxil ol')}
                        </Button>
                    </Box>

                    <Typography sx={{fontSize: 12.5, color: '#9CA3AF', mt: 3, lineHeight: 1.6}}>
                        Bu sistemdə qeydiyyat mövcud deyil. Hesabınız yoxdursa, təşkilatınızın administratoru ilə
                        əlaqə saxlayın.
                    </Typography>
                </Box>
            </Box>

            <PasswordReset
                open={showPasswordReset}
                handleClose={handleClose}
                handleSubmit={handlePasswordReset}
                loading={loading}
            />
        </Box>
    );
}