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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
// Icons
import LogoutIcon from '@mui/icons-material/Logout';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Alert from "@mui/material/Alert";
import Image from "next/image";
import logo from '../app/logo.svg'
import Theme from "@/components/main/Theme";


export default function BaseHeader({env}) {


    // Store user
    const user = useAppSelector(({user}) => user)

    // Methods
    const displayUser = user => `${user?.firstname} ${user?.lastname}`
    const initials = user => `${(user?.firstname || '')[0] || ''}${(user?.lastname || '')[0] || ''}`.toUpperCase() || '—'

    const pathname = usePathname();
    const router = useRouter();
    const isCompact = useMediaQuery('(max-width:600px)');

    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const openMenu = (e) => setAnchorEl(e.currentTarget);
    const closeMenu = () => setAnchorEl(null);
    const goTo = (route) => { closeMenu(); router.push(route); }



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
                        <Tooltip title="Hesab menyusu">
                            <Box
                                onClick={openMenu}
                                sx={{
                                    display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1,
                                    borderRadius: 999, pl: 0.5, pr: {xs: 0.5, sm: 1.25}, py: 0.5,
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    backgroundColor: menuOpen ? 'rgba(201,162,75,0.14)' : 'rgba(255,255,255,0.04)',
                                    transition: 'background-color .15s ease, border-color .15s ease',
                                    '&:hover': {backgroundColor: 'rgba(201,162,75,0.14)', borderColor: 'rgba(201,162,75,0.4)'},
                                }}
                            >
                                <Avatar sx={{
                                    width: 30, height: 30, fontSize: 13, fontWeight: 700,
                                    bgcolor: '#C9A24B', color: '#0E1730',
                                }}>
                                    {user?.isLoaded === false ? '' : initials(user)}
                                </Avatar>
                                <Typography
                                    variant="caption"
                                    noWrap
                                    component="p"
                                    sx={{
                                        display: {xs: 'none', md: 'flex'},
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: '#E7EAF3',
                                    }}
                                >
                                    {displayUser(user) || <Skeleton variant="text" width={130} color={'#fff'}
                                                                    sx={{fontSize: '1rem'}}/>}
                                </Typography>
                                <KeyboardArrowDownIcon sx={{
                                    color: '#9AA5C7', fontSize: 20,
                                    transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease',
                                }}/>
                            </Box>
                        </Tooltip>
                        <Menu
                            anchorEl={anchorEl}
                            open={menuOpen}
                            onClose={closeMenu}
                            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                            transformOrigin={{vertical: 'top', horizontal: 'right'}}
                            slotProps={{
                                paper: {
                                    sx: {
                                        mt: 1, minWidth: 220, borderRadius: 2.5,
                                        backgroundColor: '#0E1730', color: '#E7EAF3',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: '0 20px 45px rgba(2,6,36,0.5)',
                                    }
                                }
                            }}
                        >
                            <Box sx={{px: 2, py: 1.5}}>
                                <Typography sx={{fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3}} noWrap>
                                    {displayUser(user)}
                                </Typography>
                                <Typography sx={{fontSize: 12.5, color: '#9AA5C7'}} noWrap>
                                    {user?.email}
                                </Typography>
                            </Box>
                            <Divider sx={{borderColor: 'rgba(255,255,255,0.08)'}}/>
                            <MenuItem onClick={() => goTo(APP_ROUTES.PROFILE)} sx={{py: 1.2, px: 2, '&:hover': {backgroundColor: 'rgba(201,162,75,0.1)'}}}>
                                <ListItemIcon>
                                    <PersonOutlineIcon fontSize="small" sx={{color: '#C9A24B'}}/>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{fontSize: 14, fontWeight: 600}}>
                                    Hesabım
                                </ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => goTo(APP_ROUTES.SIGNOUT)} sx={{py: 1.2, px: 2, '&:hover': {backgroundColor: 'rgba(239,83,80,0.12)'}}}>
                                <ListItemIcon>
                                    <LogoutIcon fontSize="small" sx={{color: '#EF5350'}}/>
                                </ListItemIcon>
                                <ListItemText primaryTypographyProps={{fontSize: 14, fontWeight: 600, color: '#EF9A9A'}}>
                                    Çıxış
                                </ListItemText>
                            </MenuItem>
                        </Menu>
                    </Box>

                </Toolbar>
            </Theme>
        </AppBar>

    </>);
}