"use client"
import React, {useState, useEffect, useRef} from 'react';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import {ThemeProvider} from '@mui/material/styles';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
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
import appTheme from "@/components/theme/appTheme";
import {BRAND, C, FONT_STACK, TRICOLOR} from "@/components/theme/tokens";
import {float, growX, reducedMotion, reveal} from "@/components/theme/motion";
import AnimatedPattern from "@/components/shell/AnimatedPattern";
import bina from "@/app/msn_bina.png"
import logo from "@/app/logo.png"

import Image from "next/image";

const SUPPORT_EMAIL = 'itsupport@mdi.gov.az';

/* Səkkizguşəli ulduz (bayraqdakı motiv) - fon bəzəyi. */
function Star({size = 320, color = '#FFFFFF', opacity = 0.10}) {
    const h = size / 2, r1 = size * 0.48, r2 = size * 0.22;
    const pts = Array.from({length: 16}, (_, i) => {
        const r = i % 2 ? r2 : r1;
        const a = (Math.PI / 8) * i - Math.PI / 2;
        return `${(h + r * Math.cos(a)).toFixed(1)},${(h + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <polygon points={pts} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth="1.5"/>
            <circle cx={h} cy={h} r={r2 * 0.75} fill="none" stroke={color} strokeOpacity={opacity * 0.8} strokeWidth="1"/>
        </svg>
    );
}

function BrandMark({height = 44}) {
    return (
        <Box sx={{position: 'relative', width: height * 5.45, maxWidth: '100%', height, flexShrink: 0}}>
            <Image src={logo} alt="Azərbaycan Respublikasının Müdafiə Sənayesi Nazirliyi" fill priority
                   style={{objectFit: 'contain', objectPosition: 'left center'}}/>
        </Box>
    );
}

const FEATURES = [
    {Icon: ShieldOutlinedIcon, title: 'Təhlükəsiz giriş', text: 'İki mərhələli doğrulama və domen hesabı ilə.'},
    {Icon: HubOutlinedIcon, title: 'Vahid platforma', text: 'Risklər, inventar, icazələr, elanlar və təlimlər bir yerdə.'},
    {Icon: HistoryOutlinedIcon, title: 'Şəffaf tarixçə', text: 'Hər əməliyyat hərəkət tarixçəsində qeydə alınır.'},
];

/* Sol tərəf - rəsmi brend paneli (yalnız md+ ekranlarda). */
function BrandPanel() {
    return (
        <Box sx={{
            position: 'relative', overflow: 'hidden', color: '#fff',
            flex: '0 0 56%', display: {xs: 'none', md: 'flex'}, flexDirection: 'column',
            background: `radial-gradient(110% 90% at 85% 15%, ${BRAND.navy600} 0%, ${BRAND.navy900} 52%, ${BRAND.navy950} 100%)`,
            px: {md: 6, lg: 9}, py: {md: 5, lg: 6},
        }}>
            <AnimatedPattern opacity={0.04} size={120} duration={110}/>

            {/* Nazirliyin binası - fonda solğun */}
            <Box aria-hidden sx={{
                position: 'absolute', right: '-4%', bottom: 0, width: '66%', opacity: 0.2,
                mixBlendMode: 'screen',
                maskImage: 'radial-gradient(ellipse 75% 85% at 65% 100%, #000 35%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 75% 85% at 65% 100%, #000 35%, transparent 100%)',
                pointerEvents: 'none',
                '& img': {width: '100%', height: 'auto', display: 'block', filter: 'grayscale(1)'},
            }}>
                <Image src={bina} alt="" priority/>
            </Box>

            <Box aria-hidden sx={{
                position: 'absolute', right: {md: -120, lg: -60}, top: {md: 40, lg: 20},
                animation: `${float} 16s ease-in-out infinite`, [reducedMotion]: {animation: 'none'},
            }}>
                <Star size={460} color="#E9C766" opacity={0.18}/>
            </Box>

            <Box sx={{position: 'relative', ...reveal(0, 0.05)}}>
                <BrandMark height={46}/>
            </Box>

            <Box sx={{position: 'relative', my: 'auto', py: 6, maxWidth: 620}}>
                <Typography sx={{fontSize: 12.5, fontWeight: 700, letterSpacing: '0.18em', color: '#E9C766', textTransform: 'uppercase', ...reveal(1, 0.05)}}>
                    MİS platforması
                </Typography>
                <Typography component="h1" sx={{
                    mt: 2, fontSize: {md: 44, lg: 56}, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.02em',
                    ...reveal(2, 0.05),
                }}>
                    Mərkəzləşdirilmiş İnformasiya Sistemi
                </Typography>
                <Box aria-hidden sx={{
                    mt: 3, width: 120, height: 3, background: TRICOLOR, borderRadius: 2,
                    transformOrigin: 'left', transform: 'scaleX(0)',
                    animation: `${growX} 1s cubic-bezier(.2,.7,.2,1) .5s forwards`,
                    [reducedMotion]: {animation: 'none', transform: 'none'},
                }}/>
                <Typography sx={{mt: 3, fontSize: 16, lineHeight: 1.75, color: '#C3CDDD', maxWidth: 520, ...reveal(3, 0.05)}}>
                    Azərbaycan Respublikası Müdafiə Sənayesi Nazirliyinin məlumatlarının vahid platformada
                    təhlükəsiz və səmərəli idarə olunmasını təmin edən informasiya sistemi.
                </Typography>

                <Box sx={{mt: 5, display: 'flex', flexDirection: 'column', gap: 2.25}}>
                    {FEATURES.map(({Icon, title, text}, i) => (
                        <Box key={title} sx={{display: 'flex', alignItems: 'flex-start', gap: 1.75, ...reveal(4 + i, 0.05)}}>
                            <Box sx={{
                                width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                color: '#E9C766',
                            }}>
                                <Icon sx={{fontSize: 20}}/>
                            </Box>
                            <Box>
                                <Typography sx={{fontSize: 14.5, fontWeight: 650, color: '#fff'}}>{title}</Typography>
                                <Typography sx={{fontSize: 13.5, color: '#A9B6CC', mt: 0.25}}>{text}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Typography sx={{position: 'relative', fontSize: 12.5, color: '#8C9BB5'}}>
                © {new Date().getFullYear()} Azərbaycan Respublikasının Müdafiə Sənayesi Nazirliyi
            </Typography>
            <Box aria-hidden sx={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: TRICOLOR}}/>
        </Box>
    );
}

function FieldLabel({htmlFor, children}) {
    return (
        <Typography component="label" htmlFor={htmlFor} sx={{display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, mb: 0.75}}>
            {children}
        </Typography>
    );
}

const fieldSx = {
    '& .MuiOutlinedInput-root': {borderRadius: '10px', backgroundColor: '#fff', fontSize: 15},
    '& .MuiOutlinedInput-input': {py: 1.5},
};

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
        <ThemeProvider theme={appTheme}>
        <Box sx={{display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#F3F6FA', fontFamily: FONT_STACK}}>
            <CssBaseline/>

            <BrandPanel/>

            {/* Sağ tərəf - giriş forması */}
            <Box sx={{flex: '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative'}}>
                {/* Mobil başlıq */}
                <Box sx={{
                    display: {xs: 'flex', md: 'none'}, alignItems: 'center', px: 2.5, py: 2, position: 'relative',
                    background: `linear-gradient(120deg, ${BRAND.navy950}, ${BRAND.navy800})`,
                }}>
                    <BrandMark height={34}/>
                    <Box aria-hidden sx={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: TRICOLOR}}/>
                </Box>

                <Box sx={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: {xs: 2, sm: 4}, py: {xs: 5, md: 6}}}>
                    <Box sx={{width: '100%', maxWidth: 440, ...reveal(1, 0.1)}}>
                        <Box sx={{
                            position: 'relative', overflow: 'hidden',
                            backgroundColor: '#FFFFFF', borderRadius: '18px', border: `1px solid ${C.line}`,
                            boxShadow: '0 24px 60px rgba(10,27,54,0.10)',
                            px: {xs: 3, sm: 5}, pt: {xs: 4, sm: 5}, pb: {xs: 3.5, sm: 4.5},
                        }}>
                            <Box aria-hidden sx={{position: 'absolute', left: 0, right: 0, top: 0, height: 4, background: TRICOLOR}}/>

                            <Box sx={{
                                width: 48, height: 48, borderRadius: '14px', mb: 2.5,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: BRAND.accentSoft, color: BRAND.accent,
                            }}>
                                {twoFaStep ? <VerifiedUserOutlinedIcon/> : <LockOutlinedIcon/>}
                            </Box>

                            <Typography component="h2" sx={{fontSize: 24, fontWeight: 700, color: BRAND.navy900, letterSpacing: '-0.01em'}}>
                                {twoFaStep ? 'İki mərhələli doğrulama' : 'Sistemə giriş'}
                            </Typography>
                            <Typography sx={{fontSize: 14, color: C.inkMuted, mt: 0.75, mb: 3.5, lineHeight: 1.6}}>
                                {twoFaStep
                                    ? 'Autentifikasiya tətbiqinizdəki 6 rəqəmli kodu daxil edin.'
                                    : 'Domen hesabınızın istifadəçi adı və şifrəsi ilə daxil olun.'}
                            </Typography>

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
                                            sx={{...fieldSx, mb: 2.25}}
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
                                            sx={fieldSx}
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
                                                sx={{fontSize: 13, fontWeight: 600, color: BRAND.accent}}
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
                                            sx={{...fieldSx, mb: 1.5}}
                                        />

                                        <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 1.5}}>
                                            <Link
                                                onClick={handleBackToCredentials}
                                                component="button"
                                                type="button"
                                                underline="hover"
                                                sx={{fontSize: 13, fontWeight: 600, color: BRAND.accent}}
                                            >
                                                ← Geri qayıt
                                            </Link>
                                            <Link
                                                onClick={handleOpenTwoFaResetDialog}
                                                component="button"
                                                type="button"
                                                underline="hover"
                                                sx={{fontSize: 13, fontWeight: 600, color: BRAND.accent}}
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

                                {errors.common && (
                                    <Box role="alert" sx={{
                                        mb: 2.5, px: 1.75, py: 1.25, borderRadius: '10px',
                                        backgroundColor: C.dangerTint, border: `1px solid rgba(196,47,61,0.25)`,
                                    }}>
                                        <Typography sx={{fontSize: 13, color: C.danger, fontWeight: 500}}>{errors.common}</Typography>
                                    </Box>
                                )}

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    endIcon={loading ? null : <ArrowForwardIcon/>}
                                    sx={{
                                        py: 1.5, borderRadius: '10px', fontSize: 15, fontWeight: 650,
                                        backgroundColor: BRAND.navy900,
                                        '&:hover': {backgroundColor: BRAND.navy700},
                                        '&.Mui-disabled': {backgroundColor: BRAND.navy700, color: 'rgba(255,255,255,0.8)'},
                                    }}
                                >
                                    {loading
                                        ? <><CircularProgress size={18} sx={{color: '#fff', mr: 1.25}}/>Yoxlanılır…</>
                                        : (twoFaStep ? 'Təsdiqlə' : 'Daxil ol')}
                                </Button>
                            </Box>

                            <Box sx={{mt: 3.5, pt: 2.5, borderTop: `1px solid ${C.line}`}}>
                                <Typography sx={{fontSize: 12.5, color: C.inkMuted, lineHeight: 1.6}}>
                                    Sistemdə sərbəst qeydiyyat yoxdur. Hesabınız yoxdursa və ya giriş zamanı problem yaranırsa,
                                    İnformasiya texnologiyaları şöbəsinə müraciət edin:{' '}
                                    <Link href={`mailto:${SUPPORT_EMAIL}`} underline="hover" sx={{fontWeight: 600, color: BRAND.accent}}>
                                        {SUPPORT_EMAIL}
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>

                        <Typography sx={{display: {xs: 'block', md: 'none'}, textAlign: 'center', mt: 3, fontSize: 12, color: C.inkFaint}}>
                            © {new Date().getFullYear()} Azərbaycan Respublikasının Müdafiə Sənayesi Nazirliyi
                        </Typography>
                    </Box>
                </Box>
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
        </Box>
        </ThemeProvider>
    );
}