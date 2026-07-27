"use client"
import React, {useEffect} from 'react';
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import {useRouter} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {service_api} from "@/app/service";


export default function Page() {
    const router = useRouter()

    useEffect(() => {
        // TODO logout logic
        (async () => {
            try {
                await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.SIGNOUT)
                console.log('WARNING - ROUTE TO SIGNIN [chixish] ')
            } catch (e) {
                console.log(e)
            } finally {
                router.push(APP_ROUTES.SIGNIN)
            }
        })()

    }, []);

    return (
        <>
            <Box sx={{display: 'flex', width: '100vw', height: '50vh'}} justifyContent={'center'} alignItems={'center'}>
                <CircularProgress/>
            </Box>
        </>
    );
};
