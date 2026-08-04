"use client"
import React, {useEffect, useState} from 'react';
import {useAppSelector} from "@/lib/hooks";
import {APP_ROUTES} from "@/components/constants";
// Material components
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from "@mui/material/Skeleton";
import Link from 'next/link'
import {usePathname, useRouter} from 'next/navigation';
import IconButton from "@mui/material/IconButton";
import useMediaQuery from '@mui/material/useMediaQuery';
// Icons
import LogoutIcon from '@mui/icons-material/Logout';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Alert from "@mui/material/Alert";
import Image from "next/image";
import logo from '../app/logo.svg'
import Theme from "@/components/main/Theme";


export default function BaseHeader({env}) {


    // Store user
    const user = useAppSelector(({user}) => user)

    // Methods
    const displayUser = user => `${user?.firstname} ${user?.lastname}`

    const pathname = usePathname();
    const router = useRouter();
    const isCompact = useMediaQuery('(max-width:600px)');



    if (!pathname.includes(APP_ROUTES.SIGNIN) && !pathname.includes(APP_ROUTES.PASSWORD_RESET) && !pathname.includes(APP_ROUTES.TWO_FA_VERIFY) && !pathname.includes(APP_ROUTES.TWO_FA_SETUP)) return (<>

        <AppBar position="static" sx={{
            p: {xs: '8px 12px', sm: '10px 25px'}, background: "#020624"
        }}>
            <Theme mode={'dark'}>
                <Toolbar disableGutters style={{display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", rowGap: 8, minHeight: "auto"}}>
                    <Box
                        onClick={() => router.push(APP_ROUTES.HOME)}
                        sx={{position: 'relative', width: {xs: 130, sm: 180, md: 260}, height: {xs: 26, sm: 36, md: 44}, cursor: 'pointer', flexShrink: 0}}
                    >
                        <Image src={logo} alt={"logo"} fill style={{objectFit: 'contain', objectPosition: 'left center'}} priority/>
                    </Box>

                    <Box sx={{flexGrow: 0, display: 'flex', alignItems: 'center', gap: {xs: 0.5, sm: 1}}}>
                        {/*{(user?.is_org_admin || user?.is_superuser) && (*/}
                        {/*    isCompact ? (*/}
                        {/*        <Tooltip title="Qurum idarəetməsi">*/}
                        {/*            <Link href={APP_ROUTES.ORG_ADMIN}>*/}
                        {/*                <IconButton size="small" sx={{color: '#fff'}}>*/}
                        {/*                    <AdminPanelSettingsIcon fontSize="small"/>*/}
                        {/*                </IconButton>*/}
                        {/*            </Link>*/}
                        {/*        </Tooltip>*/}
                        {/*    ) : (*/}
                        {/*        <Link href={APP_ROUTES.ORG_ADMIN} style={{textDecoration: 'none'}}>*/}
                        {/*            <Button*/}
                        {/*                startIcon={<AdminPanelSettingsIcon/>}*/}
                        {/*                variant={"text"}*/}
                        {/*                sx={{color: '#fff', mr: 1, whiteSpace: 'nowrap'}}*/}
                        {/*            >*/}
                        {/*                Qurum idarəetməsi*/}
                        {/*            </Button>*/}
                        {/*        </Link>*/}
                        {/*    )*/}
                        {/*)}*/}
                        <Tooltip title={displayUser(user)}>
                            <Box sx={{
                                display: 'flex', alignItems: 'center'
                            }}>
                                <AssignmentIndIcon sx={{marginRight: 1, display: {xs: 'none', sm: 'inline-flex'}}} color={'text.primary'}/>
                                <Typography
                                    variant="caption"
                                    noWrap
                                    component="p"
                                    sx={{
                                        mr: 2,
                                        display: {
                                            xs: 'none',
                                            md: 'flex'
                                        },
                                        fontSize: 16,
                                        fontWeight: 700,
                                        textDecoration: 'none'
                                    }}
                                >
                                    {displayUser(user) || <Skeleton variant="text" width={150} color={'#fff'}
                                                                    sx={{fontSize: '1rem'}}/>}
                                </Typography>
                                {isCompact ? (
                                    <Tooltip title="Çıxış">
                                        <Link href={APP_ROUTES.SIGNOUT}>
                                            <IconButton size="small" sx={{color: '#fff'}}>
                                                <LogoutIcon fontSize="small"/>
                                            </IconButton>
                                        </Link>
                                    </Tooltip>
                                ) : (
                                    <Link href={APP_ROUTES.SIGNOUT}>
                                        <Button startIcon={<LogoutIcon/>} variant={"text"} sx={{
                                            color: '#fff', whiteSpace: 'nowrap'
                                        }}>Çıxış</Button>
                                    </Link>
                                )}
                            </Box>
                        </Tooltip>
                    </Box>

                </Toolbar>
            </Theme>
        </AppBar>

    </>);
}