"use client"
import React, {useState, useEffect, useRef} from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardCapslockIcon from '@mui/icons-material/KeyboardCapslock';
import {useRouter, useSearchParams} from "next/navigation";
import {handleError, isEmpty} from "@/app/utils";
import {useAppDispatch} from "@/lib/hooks";
import {setUser} from "@/lib/features/user/userSlice";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import PasswordReset from "@/app/daxilol/ResetPassword";
import TwoFAResetDialog from "@/components/atoms/TwoFaResetDialog";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {C} from "@/components/theme/tokens";
import AuthLayout, {
    AuthError, FieldLabel, SupportNote, authFieldSx, authLinkSx, authPrimaryButtonSx,
} from "@/components/shell/AuthLayout";

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
    // Authenticator tətbiqi silinib/telefon dəyişilib itirilib halı üçün 2FA sıfırlama sorğusu
    const [showTwoFaResetDialog, setShowTwoFaResetDialog] = useState(false);
    const [twoFaResetLoading, setTwoFaResetLoading] = useState(false);
    // user store
    const dispatch = useAppDispatch()
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const {enqueueSnackbar, closeSnackbar} = useSnackbar()

    const router = useRouter();
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [urlUserId, setUrlUserId] = useState(null);
    const formRef = useRef(null);

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
                // Naviqasiya panelinin dərhal düzgün ad/soyadı göstərməsi üçün
                // (səhifə yenilənməsini gözləmədən) istifadəçini Redux-a yazırıq.
                dispatch(setUser(user))

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
                if (twoFaStep) {
                    setCode('')
                } else {
                    // İstifadəçi adı/şifrə sahələrini boşaldırıq ki, istifadəçi hər dəfə yenidən yaza bilsin
                    // (uncontrolled input olduğu üçün ən etibarlı yol form.reset()-dir).
                    formRef.current?.reset()
                }
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


    function handleOpenTwoFaResetDialog(e) {
        e.preventDefault()
        setShowTwoFaResetDialog(true)
    }

    function handleCloseTwoFaResetDialog() {
        setShowTwoFaResetDialog(false)
    }

    async function handleTwoFaResetSubmit() {
        if (!pendingCredentials) return
        setTwoFaResetLoading(true)
        try {
            await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TWO_FA_REQUEST_RESET, {
                username: pendingCredentials.username,
                password: pendingCredentials.password,
            })
            enqueueSnackbar(
                'Sorğunuz qəbul olundu. Məlumatlarınız doğrudursa, e-poçt ünvanınıza bildiriş göndərildi. Yenidən daxil olmağa cəhd edin.',
                {variant: 'success', autoHideDuration: 6000}
            )
            setShowTwoFaResetDialog(false)
            handleBackToCredentials()
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'})
        } finally {
            setTwoFaResetLoading(false)
        }
    }

    const handleCapsLock = (event) => {
        setCapsLockOn(event.getModifierState && event.getModifierState('CapsLock'));
    };

    async function handlePasswordReset(username) {
        setLoading(true)
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.REQUEST_RESET, {username})
            enqueueSnackbar('E-poçt ünvanınıza bir dəfəlik kod göndərildi.', {variant: 'success'})
            setShowPasswordReset(false)
            router.push(`${APP_ROUTES.PASSWORD_RESET}?username=${encodeURIComponent(username)}`)
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'})
            setShowPasswordReset(false)
        } finally {
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
        <AuthLayout
            icon={twoFaStep ? <VerifiedUserOutlinedIcon/> : <LockOutlinedIcon/>}
            title={twoFaStep ? 'İki mərhələli doğrulama' : 'Sistemə giriş'}
            subtitle={twoFaStep
                ? 'Autentifikasiya tətbiqinizdəki 6 rəqəmli kodu daxil edin.'
                : 'Domen hesabınızın istifadəçi adı və şifrəsi ilə daxil olun.'}
            footer={(
                <SupportNote>
                    Sistemdə sərbəst qeydiyyat yoxdur. Hesabınız yoxdursa və ya giriş zamanı problem yaranırsa,
                    İnformasiya texnologiyaları şöbəsinə müraciət edin:
                </SupportNote>
            )}
        >
            <Box component="form" ref={formRef} onSubmit={handleSubmit} noValidate>
                {!twoFaStep ? (
                    <>
                        <FieldLabel htmlFor="username">İstifadəçi adı və ya elektron poçt</FieldLabel>
                        <TextField
                            fullWidth
                            required
                            id="username"
                            placeholder="məs. ad.soyad"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            error={!!errors.username}
                            helperText={errors.username}
                            disabled={loading}
                            sx={{...authFieldSx, mb: 2.25}}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlineIcon sx={{fontSize: 20, color: C.inkFaint}}/>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <FieldLabel htmlFor="password">Şifrə</FieldLabel>
                        <TextField
                            fullWidth
                            required
                            onKeyDown={handleCapsLock}
                            onKeyUp={handleCapsLock}
                            error={!!errors.password}
                            helperText={errors.password || ''}
                            name="password"
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            disabled={loading}
                            sx={authFieldSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon sx={{fontSize: 19, color: C.inkFaint}}/>
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            disabled={loading}
                                            onClick={handleClickShowPassword}
                                            edge="end"
                                            aria-label={showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                                        >
                                            {showPassword ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1, mb: 3, minHeight: 22}}>
                            {capsLockOn ? (
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5, color: C.warning}}>
                                    <KeyboardCapslockIcon sx={{fontSize: 16}}/>
                                    <Typography sx={{fontSize: 12.5, fontWeight: 600}}>Caps Lock açıqdır</Typography>
                                </Box>
                            ) : <span/>}
                            <Link
                                onClick={handlePasswordResetDialog}
                                component="button"
                                type="button"
                                underline="hover"
                                sx={authLinkSx}
                            >
                                Şifrənizi unutmusunuz?
                            </Link>
                        </Box>
                    </>
                ) : (
                    <>
                        <FieldLabel htmlFor="code">Doğrulama kodu</FieldLabel>
                        <TextField
                            fullWidth
                            required
                            id="code"
                            name="code"
                            placeholder="000000"
                            autoComplete="one-time-code"
                            autoFocus
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            error={!!errors.common}
                            disabled={loading}
                            inputProps={{
                                inputMode: 'numeric', maxLength: 6,
                                style: {letterSpacing: 12, textAlign: 'center', fontSize: 24, fontWeight: 700},
                            }}
                            sx={{...authFieldSx, mb: 1.5}}
                        />

                        <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1.5}}>
                            <Link
                                onClick={handleBackToCredentials}
                                component="button"
                                type="button"
                                underline="hover"
                                sx={authLinkSx}
                            >
                                ← Geri qayıt
                            </Link>
                            <Link
                                onClick={handleOpenTwoFaResetDialog}
                                component="button"
                                type="button"
                                underline="hover"
                                sx={authLinkSx}
                            >
                                Kodu əldə edə bilmirəm
                            </Link>
                        </Box>
                        <Typography sx={{fontSize: 12.5, color: C.inkFaint, mb: 3, lineHeight: 1.6}}>
                            Autentifikasiya tətbiqi silinibsə və ya telefonunuz dəyişilib/itirilibsə,
                            «Kodu əldə edə bilmirəm» bağlantısı ilə 2FA-nın sıfırlanmasını istəyin.
                        </Typography>
                    </>
                )}

                <AuthError>{errors.common}</AuthError>

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    endIcon={loading ? null : <ArrowForwardIcon/>}
                    sx={authPrimaryButtonSx}
                >
                    {loading
                        ? <><CircularProgress size={18} sx={{color: '#fff', mr: 1.25}}/>Yoxlanılır…</>
                        : (twoFaStep ? 'Təsdiqlə' : 'Daxil ol')}
                </Button>
            </Box>

            <PasswordReset
                open={showPasswordReset}
                handleClose={handleClose}
                handleSubmit={handlePasswordReset}
                loading={loading}
            />

            <TwoFAResetDialog
                open={showTwoFaResetDialog}
                handleClose={handleCloseTwoFaResetDialog}
                handleSubmit={handleTwoFaResetSubmit}
                loading={twoFaResetLoading}
            />
        </AuthLayout>
    );
}