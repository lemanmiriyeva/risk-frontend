import React, {Suspense} from 'react'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './globals.css'
import Container from "@mui/material/Container";
import UserFetcher from "./UserFetcher";
import SnackProvider from "./SnackbarProvider";
import BaseHeader from "../components/BaseHeader";
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
        <html lang="en">
        <body>
        <StoreProvider>
            <Theme mode={'light'}>
                    <Suspense fallback={<h1>Loading</h1>}>
                        <SnackProvider>

                            <BaseHeader env={process.env.ENVIRONMENT} />
                            <UserFetcher/>
                            {children}
                        </SnackProvider>
                    </Suspense>
            </Theme>
        </StoreProvider>
        </body>
        </html>
    );
}