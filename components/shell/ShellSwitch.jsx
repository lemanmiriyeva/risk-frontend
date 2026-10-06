"use client"
import React from 'react';
import {usePathname} from 'next/navigation';
import BaseHeader from "@/components/BaseHeader";
import {APP_ROUTES} from "@/components/constants";
import AppShell from "./AppShell";

/*
 * Giriş axınının səhifələri (giriş, şifrə bərpası, 2FA, təsdiq gözləmə, çıxış)
 * köhnə görünüşdə qalır - yeni karkas yalnız sistemin daxili səhifələrinə tətbiq olunur.
 */
const AUTH_ROUTES = [
    APP_ROUTES.SIGNIN,
    APP_ROUTES.PASSWORD_RESET,
    APP_ROUTES.TWO_FA_SETUP,
    APP_ROUTES.PENDING_APPROVAL,
    APP_ROUTES.SIGNOUT,
];

export function isAuthRoute(pathname) {
    return AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

export default function ShellSwitch({env, children}) {
    const pathname = usePathname() || '/';
    if (isAuthRoute(pathname)) {
        return (
            <>
                <BaseHeader env={env}/>
                {children}
            </>
        );
    }
    return <AppShell>{children}</AppShell>;
}
