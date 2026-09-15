'use client'
import React from "react";
import {ThemeProvider, createTheme} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';


export default function ({children, mode}) {

    const materialTheme = createTheme({
        typography: {
            // @fontsource/roboto app/layout.js-də import olunur, amma CssBaseline
            // olmadan bu font YALNIZ MUI Typography komponentlərinə tətbiq olunurdu.
            // CssBaseline (aşağıda) bunu bütün body/html-ə tətbiq edir ki, bütün
            // istifadəçilərdə (fərqli OS/brauzerdə) eyni font görünsün, sistemin
            // default fontuna (ui-sans-serif/system-ui) "geri düşmə" olmasın.
            fontFamily: [
                'Roboto',
                '"Helvetica Neue"',
                'Arial',
                'sans-serif',
            ].join(','),
        },
        palette: {
            primary: {
                light: '#020624',
                main: '#020624',
                dark: '#020624',
                disabled: "#979797",
                textDark: '#2A3439',
                textLight: '#F2F2F2'
            },
            secondary: {
                main: "#D9594C"
            },
            components: {
                MuiButton: {},
            }
        }
    })


    return (
        <ThemeProvider theme={materialTheme} defaultMode={mode || 'light'}>
            <CssBaseline/>
            {children}
        </ThemeProvider>
    )

}