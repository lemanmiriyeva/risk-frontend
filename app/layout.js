import React, {Suspense} from 'react'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource-variable/inter';
import '@fontsource/noto-serif/500.css';
import '@fontsource/noto-serif/600.css';
import './globals.css'
import Container from "@mui/material/Container";
import UserFetcher from "./UserFetcher";
import SnackProvider from "./SnackbarProvider";
import ShellSwitch from "@/components/shell/ShellSwitch";
import Theme from '../components/main/Theme'
import StoreProvider from "@/app/StoreProvider";
export const metadata = {
  title: 'Mərkəzləşdirilmiş İnformasiya Sistemi',
  description: 'Mərkəzləşdirilmiş İnformasiya Sistemi',
    icons: {
        icon: "icon.png",
    },
}

export default function RootLayout({ children, params }) {
    return (
        <html lang="az">
        <body>
        <StoreProvider>
            <Theme mode={'light'}>
                    <Suspense fallback={<h1>Loading</h1>}>
                        <SnackProvider>

                            <UserFetcher/>
                            <ShellSwitch env={process.env.ENVIRONMENT}>
                                {children}
                            </ShellSwitch>
                        </SnackProvider>
                    </Suspense>
            </Theme>
        </StoreProvider>
        </body>
        </html>
    );
}