'use client'
import React from "react";
import {ThemeProvider, createTheme} from '@mui/material';


export default function ({children, mode}) {

    const materialTheme = createTheme({
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
            {children}
        </ThemeProvider>
    )

}