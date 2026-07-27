'use client'

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setUser, removeUser } from "@/lib/features/user/userSlice";
import { NEXT_API_ENDPOINTS } from "@/app/urls";
import { useRouter, usePathname } from "next/navigation";
import { handleError, isEmpty, require_login } from "@/app/utils";
import { APP_ROUTES } from "@/components/constants";
import { service_api } from "@/app/service";
import { useSnackbar } from "notistack";

export default function UserFetcher() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.user);
    const router = useRouter();
    const pathname = usePathname();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        const fetchUserData = async () => {
            // Artıq yüklənibsə (uğurlu və ya uğursuz), təkrar sorğu göndərmə
            if (user?.isLoaded) return;

            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER);

                if (res.status === 200 && res.data && !isEmpty(res.data)) {
                    dispatch(setUser(res.data));

                    // Yalnız login səhifəsindəyiksə ana səhifəyə göndər
                    if (pathname === APP_ROUTES.SIGNIN) {
                        router.push(APP_ROUTES.HOME);
                    }
                } else {
                    dispatch(removeUser());
                }
            } catch (e) {
                console.error("User fetch failed:", e);
                dispatch(removeUser());
                if (require_login(pathname) && pathname !== APP_ROUTES.SIGNIN) {
                    router.push(APP_ROUTES.SIGNIN);
                }
            }
        };

        fetchUserData();
    }, [dispatch, pathname, router, user]);

    return null;
}