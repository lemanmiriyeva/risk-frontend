"use client"
import {createTheme} from '@mui/material/styles';
import {BRAND, C, FONT_STACK} from "./tokens";

/*
 * Sistemin daxili səhifələri üçün MUI teması (giriş səhifələri köhnə temada qalır).
 * Ümumi komponent görünüşü (düymə, input, dialoq, cədvəl) burada bir dəfə
 * təyin olunur ki, ayrı-ayrı səhifələrdə təkrarlanmasın.
 */
const appTheme = createTheme({
    typography: {
        fontFamily: FONT_STACK,
        fontSize: 14,
        h1: {fontWeight: 750, letterSpacing: '-0.02em'},
        h2: {fontWeight: 750, letterSpacing: '-0.02em'},
        h3: {fontWeight: 700, letterSpacing: '-0.015em'},
        h4: {fontWeight: 700, letterSpacing: '-0.01em'},
        h5: {fontWeight: 700},
        h6: {fontWeight: 700},
        button: {fontWeight: 600, textTransform: 'none', letterSpacing: 0},
    },
    shape: {borderRadius: 10},
    palette: {
        mode: 'light',
        primary: {main: BRAND.navy900, light: BRAND.navy600, dark: BRAND.navy950, contrastText: '#fff'},
        secondary: {main: BRAND.accent, dark: BRAND.accentDark, contrastText: '#fff'},
        info: {main: BRAND.accent},
        success: {main: C.success},
        error: {main: C.danger},
        warning: {main: C.warning},
        background: {default: '#F3F6FA', paper: '#FFFFFF'},
        text: {primary: C.ink, secondary: C.inkMuted, disabled: C.inkFaint},
        divider: C.line,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {fontFamily: FONT_STACK, backgroundColor: '#F3F6FA', WebkitFontSmoothing: 'antialiased'},
            },
        },
        MuiButton: {
            defaultProps: {disableElevation: true},
            styleOverrides: {
                root: {borderRadius: 10, fontWeight: 600, paddingInline: 16},
                containedPrimary: {
                    backgroundColor: BRAND.navy900,
                    '&:hover': {backgroundColor: BRAND.navy700},
                },
                outlined: {borderColor: C.lineStrong, '&:hover': {borderColor: BRAND.accent, backgroundColor: C.goldTint}},
            },
        },
        MuiIconButton: {styleOverrides: {root: {borderRadius: 10}}},
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {borderColor: C.line},
                    '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: C.lineStrong},
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: BRAND.accent, borderWidth: 1.5},
                    '&.Mui-focused': {boxShadow: `0 0 0 3px ${C.goldTint}`},
                },
            },
        },
        MuiInputLabel: {styleOverrides: {root: {'&.Mui-focused': {color: BRAND.accent}}}},
        MuiPaper: {styleOverrides: {rounded: {borderRadius: 14}}},
        MuiDialog: {
            styleOverrides: {
                paper: {borderRadius: 18, boxShadow: '0 30px 80px rgba(6,18,38,0.28)'},
            },
        },
        MuiBackdrop: {styleOverrides: {root: {'&:not(.MuiBackdrop-invisible)': {backgroundColor: 'rgba(6,18,38,0.45)', backdropFilter: 'blur(2px)'}}}},
        MuiMenu: {styleOverrides: {paper: {borderRadius: 12, border: `1px solid ${C.line}`, boxShadow: '0 18px 40px rgba(6,18,38,0.14)'}}},
        MuiTooltip: {
            styleOverrides: {
                tooltip: {backgroundColor: BRAND.navy900, fontSize: 12, fontWeight: 500, borderRadius: 8, padding: '6px 10px'},
                arrow: {color: BRAND.navy900},
            },
        },
        MuiChip: {styleOverrides: {root: {borderRadius: 8, fontWeight: 600}}},
        MuiTabs: {styleOverrides: {indicator: {height: 3, borderRadius: 3, backgroundColor: BRAND.accent}}},
        MuiTab: {styleOverrides: {root: {textTransform: 'none', fontWeight: 600, '&.Mui-selected': {color: C.ink}}}},
        MuiSwitch: {
            styleOverrides: {
                switchBase: {'&.Mui-checked': {color: BRAND.accent, '& + .MuiSwitch-track': {backgroundColor: BRAND.accent}}},
            },
        },
        MuiCheckbox: {styleOverrides: {root: {'&.Mui-checked': {color: BRAND.accent}}}},
        MuiRadio: {styleOverrides: {root: {'&.Mui-checked': {color: BRAND.accent}}}},
        MuiLinearProgress: {styleOverrides: {root: {borderRadius: 999}, bar: {borderRadius: 999}}},
        MuiSkeleton: {styleOverrides: {root: {backgroundColor: 'rgba(15,38,71,0.07)'}}},
        MuiDataGrid: {
            styleOverrides: {
                root: {
                    borderRadius: 14,
                    borderColor: C.line,
                    backgroundColor: '#fff',
                    '--DataGrid-containerBackground': C.surfaceRaised,
                    '& .MuiDataGrid-columnHeaderTitle': {fontWeight: 650, color: C.inkMuted},
                    '& .MuiDataGrid-row:hover': {backgroundColor: C.goldWash},
                    '& .MuiDataGrid-row.Mui-selected': {backgroundColor: C.goldTint},
                },
            },
        },
    },
});

export default appTheme;
