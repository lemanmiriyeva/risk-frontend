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
// Icons
import LogoutIcon from '@mui/icons-material/Logout';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
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



    if (!pathname.includes(APP_ROUTES.SIGNIN) && !pathname.includes(APP_ROUTES.PASSWORD_RESET) && !pathname.includes(APP_ROUTES.TWO_FA_VERIFY) && !pathname.includes(APP_ROUTES.TWO_FA_SETUP)) return (<>

        <AppBar position="static" sx={{
          p: '10px 25px',background:"#020624"
        }}>
            <Theme mode={'dark'}>
                <Toolbar style={{display: "flex", justifyContent: "space-between",alignItems:"center"}}>
                    <Image onClick={() => router.push(APP_ROUTES.HOME)} src={logo} width={"300"} height={"60"}
                                     alt={"logo"} style={{cursor: 'pointer'}} priority/>

                    <Box sx={{flexGrow: 0}}>
                        <Tooltip title={displayUser(user)}>
                            <Box sx={{
                                display: 'flex', alignItems: 'center'
                            }}>
                                <AssignmentIndIcon sx={{marginRight: 1}} color={'text.primary'}/>
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
                                <Link href={APP_ROUTES.SIGNOUT}>
                                    <Button startIcon={<LogoutIcon/>} variant={"text"} sx={{
                                        color: '#fff'
                                    }}>Çıxış</Button>
                                </Link>
                            </Box>
                        </Tooltip>
                    </Box>

                </Toolbar>
            </Theme>
        </AppBar>

    </>);
}
