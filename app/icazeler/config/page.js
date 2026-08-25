"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormControlLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Switch,
    Typography,
} from "@mui/material";

import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";


/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
|
| Əgər səndə service_api başqa yerdən import olunursa,
| sadəcə bu importu öz layihəndəki path ilə dəyiş.
|
*/

import { service_api } from "@/app/service";


const API = {
    CONFIG: "/attendance-permissions/config/",
    USERS: "/attendance-permissions/config/users/",
    DEPARTMENT_CONFIG: "/attendance-permissions/config/departments/",
};


/*
|--------------------------------------------------------------------------
| STYLE
|--------------------------------------------------------------------------
*/

const colors = {
    background: "#F7F6F2",
    white: "#FFFFFF",
    border: "#E4E1D8",
    borderDark: "#D2CEC3",
    text: "#211F1A",
    muted: "#716C60",
    lightText: "#969083",
    gold: "#9B782C",
    danger: "#B54747",
};


/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function AttendancePermissionConfigPage() {

    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [loading, setLoading] = useState(true);

    const [savingApparatus, setSavingApparatus] = useState(false);

    const [savingDepartment, setSavingDepartment] = useState(null);

    const [apparatus, setApparatus] = useState(null);

    const [departments, setDepartments] = useState([]);

    const [users, setUsers] = useState([]);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");


    /*
    |--------------------------------------------------------------------------
    | USER-LƏR
    |--------------------------------------------------------------------------
    */

    const activeUsers = useMemo(() => {

        return users.filter(
            (user) => user.is_active
        );

    }, [users]);


    /*
    |--------------------------------------------------------------------------
    | API-DAN DATA ÇƏK
    |--------------------------------------------------------------------------
    */

    const loadData = useCallback(async () => {

        setLoading(true);
        setError("");

        try {

            const [configResponse, usersResponse] =
                await Promise.all([
                    service_api.get(API.CONFIG),
                    service_api.get(API.USERS),
                ]);


            const configData = configResponse?.data || {};

            const usersData =
                usersResponse?.data || [];


            setApparatus(
                configData.apparatus || null
            );


            setDepartments(
                Array.isArray(configData.departments)
                    ? configData.departments
                    : []
            );


            setUsers(
                Array.isArray(usersData)
                    ? usersData
                    : []
            );


        } catch (err) {

            console.error(
                "Attendance permission config error:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Konfiqurasiya məlumatlarını yükləmək mümkün olmadı."
            );

        } finally {

            setLoading(false);

        }

    }, []);


    /*
    |--------------------------------------------------------------------------
    | PAGE LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        loadData();

    }, [loadData]);


    /*
    |--------------------------------------------------------------------------
    | APARAT RƏHBƏRİ DƏYİŞ
    |--------------------------------------------------------------------------
    */

    const handleApparatusEnabledChange = (event) => {

        const enabled =
            event.target.checked;


        setApparatus((current) => {

            if (!current) {
                return current;
            }


            return {
                ...current,

                apparatus_head_enabled:
                enabled,

                /*
                 * OFF ediləndə seçilmiş şəxsi silmirik.
                 *
                 * Sonradan yenidən ON ediləndə
                 * əvvəlki şəxs qalsın.
                 */
            };

        });

    };


    /*
    |--------------------------------------------------------------------------
    | APARAT RƏHBƏRİ SEÇ
    |--------------------------------------------------------------------------
    */

    const handleApparatusHeadChange = (event) => {

        const value =
            event.target.value;


        setApparatus((current) => {

            if (!current) {
                return current;
            }


            return {
                ...current,

                apparatus_head:
                    value === ""
                        ? null
                        : Number(value),
            };

        });

    };


    /*
    |--------------------------------------------------------------------------
    | APARAT RƏHBƏRİ SAVE
    |--------------------------------------------------------------------------
    */

    const saveApparatus = async () => {

        if (!apparatus) {
            return;
        }


        /*
         * Aktivdirsə, şəxs seçilməlidir.
         */

        if (
            apparatus.apparatus_head_enabled &&
            !apparatus.apparatus_head
        ) {

            setError(
                "Aparat rəhbəri aktivdirsə, şəxs seçilməlidir."
            );

            return;
        }


        setSavingApparatus(true);
        setError("");


        try {

            const response =
                await service_api.patch(
                    API.CONFIG,
                    {
                        apparatus_head_enabled:
                        apparatus.apparatus_head_enabled,

                        apparatus_head:
                        apparatus.apparatus_head,
                    }
                );


            setApparatus(
                response?.data || apparatus
            );


            setSuccess(
                "Aparat rəhbəri konfiqurasiyası yadda saxlanıldı."
            );


        } catch (err) {

            console.error(
                "Apparatus config save error:",
                err
            );


            setError(
                err?.response?.data?.detail ||
                "Aparat rəhbəri konfiqurasiyası yadda saxlanılmadı."
            );

        } finally {

            setSavingApparatus(false);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | DEPARTAMENT MÜDİRİ ON/OFF
    |--------------------------------------------------------------------------
    */

    const handleDepartmentManagerChange = (
        departmentId,
        enabled
    ) => {

        setDepartments((current) => {

            return current.map((item) => {

                if (
                    item.department !== departmentId
                ) {
                    return item;
                }


                return {
                    ...item,

                    manager_enabled:
                    enabled,

                    /*
                     * OFF ediləndə replacement
                     * avtomatik silinmir.
                     */
                };

            });

        });

    };


    /*
    |--------------------------------------------------------------------------
    | ƏVƏZLƏYİCİ SEÇ
    |--------------------------------------------------------------------------
    */

    const handleReplacementChange = (
        departmentId,
        value
    ) => {

        setDepartments((current) => {

            return current.map((item) => {

                if (
                    item.department !== departmentId
                ) {
                    return item;
                }


                const selectedUser =
                    activeUsers.find(
                        (user) =>
                            user.id === Number(value)
                    );


                return {
                    ...item,

                    replacement_user:
                        value === ""
                            ? null
                            : Number(value),

                    replacement_user_name:
                        selectedUser?.name || null,
                };

            });

        });

    };


    /*
    |--------------------------------------------------------------------------
    | DEPARTAMENT SAVE
    |--------------------------------------------------------------------------
    */

    const saveDepartment = async (
        department
    ) => {

        const departmentId =
            department.department;


        /*
         * Müdir OFF-dursa,
         * əvəzləyici mütləq olmalıdır.
         */

        if (
            !department.manager_enabled &&
            !department.replacement_user
        ) {

            setError(
                `${department.department_name} üçün şöbə müdiri deaktivdir. Əvəzləyici şəxs seçilməlidir.`
            );

            return;
        }


        setSavingDepartment(
            departmentId
        );

        setError("");


        try {

            const response =
                await service_api.patch(
                    `${API.DEPARTMENT_CONFIG}${departmentId}/`,
                    {
                        manager_enabled:
                        department.manager_enabled,

                        replacement_user:
                        department.replacement_user,
                    }
                );


            const updated =
                response?.data;


            if (updated) {

                setDepartments((current) => {

                    return current.map(
                        (item) => {

                            if (
                                item.department !==
                                departmentId
                            ) {
                                return item;
                            }


                            return {
                                ...item,

                                ...updated,
                            };

                        }
                    );

                });

            }


            setSuccess(
                `${department.department_name} üçün konfiqurasiya yadda saxlanıldı.`
            );


        } catch (err) {

            console.error(
                "Department config save error:",
                err
            );


            setError(
                err?.response?.data?.detail ||
                `"${
                    department.department_name
                }" üçün konfiqurasiya yadda saxlanılmadı.`
            );

        } finally {

            setSavingDepartment(null);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (
            <Box
                sx={{
                    minHeight: "60vh",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",
                }}
            >
                <CircularProgress
                    size={32}
                />
            </Box>
        );

    }


    /*
    |--------------------------------------------------------------------------
    | PAGE
    |--------------------------------------------------------------------------
    */

    return (
        <Box
            sx={{
                width: "100%",

                minHeight: "100vh",

                backgroundColor:
                colors.background,

                px: {
                    xs: 1.5,
                    sm: 2.5,
                    md: 4,
                },

                py: {
                    xs: 2,
                    md: 4,
                },
            }}
        >

            <Box
                sx={{
                    width: "100%",

                    maxWidth: 1500,

                    mx: "auto",
                }}
            >

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <Box
                    sx={{
                        display: "flex",

                        alignItems: "center",

                        gap: 1.5,

                        mb: 3,
                    }}
                >

                    <Box
                        sx={{
                            width: 42,

                            height: 42,

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            borderRadius: "10px",

                            backgroundColor:
                            colors.white,

                            border:
                                `1px solid ${colors.border}`,
                        }}
                    >

                        <SettingsOutlinedIcon
                            sx={{
                                color:
                                colors.gold,

                                fontSize: 22,
                            }}
                        />

                    </Box>


                    <Box>

                        <Typography
                            sx={{
                                fontSize: {
                                    xs: 18,
                                    md: 21,
                                },

                                fontWeight: 600,

                                color:
                                colors.text,
                            }}
                        >
                            İcazə konfiqurasiyası
                        </Typography>


                        <Typography
                            sx={{
                                fontSize: 13,

                                color:
                                colors.muted,

                                mt: 0.3,
                            }}
                        >
                            Aparat rəhbəri və
                            departamentlər üzrə
                            icazə təsdiqçilərinin
                            idarə edilməsi
                        </Typography>

                    </Box>

                </Box>


                {/* =====================================================
                    APARAT RƏHBƏRİ
                ====================================================== */}

                <Paper
                    elevation={0}
                    sx={{
                        backgroundColor:
                        colors.white,

                        border:
                            `1px solid ${colors.border}`,

                        borderRadius: "12px",

                        mb: 3,

                        overflow: "hidden",
                    }}
                >

                    {/* TITLE */}

                    <Box
                        sx={{
                            px: {
                                xs: 2,
                                md: 3,
                            },

                            py: 2,

                            borderBottom:
                                `1px solid ${colors.border}`,
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize: 15,

                                fontWeight: 600,

                                color:
                                colors.text,
                            }}
                        >
                            Aparat rəhbəri
                        </Typography>


                        <Typography
                            sx={{
                                fontSize: 12.5,

                                color:
                                colors.muted,

                                mt: 0.5,
                            }}
                        >
                            Aparat rəhbəri mərhələsini
                            aktiv/deaktiv edin və
                            təsdiqləyəcək şəxsi seçin.
                        </Typography>

                    </Box>


                    {apparatus && (

                        <Box
                            sx={{
                                px: {
                                    xs: 2,
                                    md: 3,
                                },

                                py: 2.5,

                                display: "grid",

                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "220px minmax(250px, 1fr) 130px",
                                },

                                gap: 2,

                                alignItems: "center",
                            }}
                        >

                            {/* SWITCH */}

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={
                                            !!apparatus.apparatus_head_enabled
                                        }

                                        onChange={
                                            handleApparatusEnabledChange
                                        }
                                    />
                                }

                                label={
                                    apparatus.apparatus_head_enabled
                                        ? "Aktivdir"
                                        : "Söndürülüb"
                                }

                                sx={{
                                    m: 0,

                                    "& .MuiFormControlLabel-label":
                                        {
                                            fontSize: 13,

                                            color:
                                            colors.text,
                                        },
                                }}
                            />


                            {/* SELECT */}

                            <FormControl
                                size="small"
                                fullWidth
                            >

                                <Select
                                    value={
                                        apparatus.apparatus_head
                                            ? String(
                                                apparatus.apparatus_head
                                            )
                                            : ""
                                    }

                                    disabled={
                                        !apparatus.apparatus_head_enabled
                                    }

                                    displayEmpty

                                    onChange={
                                        handleApparatusHeadChange
                                    }

                                    sx={{
                                        fontSize: 13,

                                        borderRadius:
                                            "8px",
                                    }}
                                >

                                    <MenuItem value="">
                                        Aparat rəhbəri seçin
                                    </MenuItem>


                                    {activeUsers.map(
                                        (user) => (

                                            <MenuItem
                                                key={user.id}
                                                value={String(user.id)}
                                            >

                                                {user.name}

                                                {user.role_name
                                                    ? ` — ${user.role_name}`
                                                    : ""}

                                            </MenuItem>

                                        )
                                    )}

                                </Select>

                            </FormControl>


                            {/* SAVE */}

                            <Button
                                variant="contained"

                                onClick={
                                    saveApparatus
                                }

                                disabled={
                                    savingApparatus
                                }

                                startIcon={
                                    savingApparatus ? (
                                        <CircularProgress
                                            size={15}
                                            sx={{
                                                color:
                                                    "inherit",
                                            }}
                                        />
                                    ) : (
                                        <SaveOutlinedIcon
                                            sx={{
                                                fontSize: 17,
                                            }}
                                        />
                                    )
                                }

                                sx={{
                                    height: 38,

                                    backgroundColor:
                                    colors.text,

                                    color:
                                    colors.white,

                                    borderRadius:
                                        "8px",

                                    boxShadow:
                                        "none",

                                    textTransform:
                                        "none",

                                    fontSize: 12.5,

                                    "&:hover": {
                                        backgroundColor:
                                        colors.gold,

                                        boxShadow:
                                            "none",
                                    },
                                }}
                            >
                                {savingApparatus
                                    ? "Saxlanılır..."
                                    : "Yadda saxla"}
                            </Button>

                        </Box>

                    )}


                    {/* WARNING */}

                    {apparatus &&
                        !apparatus.apparatus_head_enabled && (

                            <Box
                                sx={{
                                    mx: {
                                        xs: 2,
                                        md: 3,
                                    },

                                    mb: 2.5,

                                    px: 1.5,

                                    py: 1.2,

                                    borderRadius: "7px",

                                    backgroundColor:
                                        "#FFF8E8",

                                    border:
                                        "1px solid #EEDDAA",
                                }}
                            >

                                <Typography
                                    sx={{
                                        fontSize: 12,

                                        color:
                                            "#876A24",
                                    }}
                                >
                                    Aparat rəhbəri təsdiq
                                    mərhələsi söndürülüb.
                                    Şöbə müdiri təsdiqindən
                                    sonra sorğu avtomatik
                                    təsdiqlənəcək.
                                </Typography>

                            </Box>

                        )}

                </Paper>


                {/* =====================================================
                    DEPARTAMENTLƏR
                ====================================================== */}

                <Paper
                    elevation={0}
                    sx={{
                        backgroundColor:
                        colors.white,

                        border:
                            `1px solid ${colors.border}`,

                        borderRadius:
                            "12px",

                        overflow:
                            "hidden",
                    }}
                >

                    {/* TITLE */}

                    <Box
                        sx={{
                            px: {
                                xs: 2,
                                md: 3,
                            },

                            py: 2,

                            borderBottom:
                                `1px solid ${colors.border}`,
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize: 15,

                                fontWeight: 600,

                                color:
                                colors.text,
                            }}
                        >
                            Departamentlər
                        </Typography>


                        <Typography
                            sx={{
                                fontSize: 12.5,

                                color:
                                colors.muted,

                                mt: 0.5,
                            }}
                        >
                            Hər departament üçün şöbə
                            müdirini aktiv/deaktiv edə
                            və deaktiv olduqda
                            əvəzləyici şəxs seçə bilərsiniz.
                        </Typography>

                    </Box>


                    {/* =================================================
                        DESKTOP HEADER
                    ================================================== */}

                    <Box
                        sx={{
                            display: {
                                xs: "none",
                                md: "grid",
                            },

                            gridTemplateColumns:
                                "1.4fr 1.3fr 1.5fr 125px",

                            gap: 2,

                            px: 3,

                            py: 1.5,

                            backgroundColor:
                                "#FAF9F5",

                            borderBottom:
                                `1px solid ${colors.border}`,
                        }}
                    >

                        <Typography
                            sx={tableHeaderStyle}
                        >
                            Departament
                        </Typography>


                        <Typography
                            sx={tableHeaderStyle}
                        >
                            Şöbə müdiri
                        </Typography>


                        <Typography
                            sx={tableHeaderStyle}
                        >
                            Əvəzləyici
                        </Typography>


                        <Typography
                            sx={tableHeaderStyle}
                        >
                            Əməliyyat
                        </Typography>

                    </Box>


                    {/* =================================================
                        DEPARTAMENT ROWS
                    ================================================== */}

                    {departments.length === 0 ? (

                        <Box
                            sx={{
                                p: 4,

                                textAlign:
                                    "center",
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize: 13,

                                    color:
                                    colors.muted,
                                }}
                            >
                                Departament tapılmadı.
                            </Typography>

                        </Box>

                    ) : (

                        departments.map(
                            (department) => {

                                const isSaving =
                                    savingDepartment ===
                                    department.department;


                                const managerDisabled =
                                    !department.manager_enabled;


                                /*
                                 * Həmin departamentin
                                 * istifadəçiləri.
                                 */

                                const departmentUsers =
                                    activeUsers.filter(
                                        (user) =>
                                            user.department ===
                                            department.department
                                    );


                                return (

                                    <Box
                                        key={
                                            department.department
                                        }

                                        sx={{
                                            px: {
                                                xs: 2,
                                                md: 3,
                                            },

                                            py: 2,

                                            borderBottom:
                                                `1px solid ${colors.border}`,

                                            display: "grid",

                                            gridTemplateColumns: {
                                                xs: "1fr",
                                                md:
                                                    "1.4fr 1.3fr 1.5fr 125px",
                                            },

                                            gap: {
                                                xs: 1.5,
                                                md: 2,
                                            },

                                            alignItems:
                                                "center",
                                        }}
                                    >

                                        {/* =================================
                                            DEPARTAMENT
                                        ================================== */}

                                        <Box>

                                            <Typography
                                                sx={{
                                                    fontSize: 13.5,

                                                    fontWeight: 500,

                                                    color:
                                                    colors.text,
                                                }}
                                            >
                                                {
                                                    department.department_name
                                                }
                                            </Typography>

                                        </Box>


                                        {/* =================================
                                            MÜDİR
                                        ================================== */}

                                        <Box>

                                            <FormControlLabel
                                                sx={{
                                                    m: 0,

                                                    "& .MuiFormControlLabel-label":
                                                        {
                                                            fontSize: 12.5,

                                                            color:
                                                            colors.text,
                                                        },
                                                }}

                                                control={
                                                    <Switch
                                                        size="small"

                                                        checked={
                                                            !!department.manager_enabled
                                                        }

                                                        onChange={
                                                            (event) =>
                                                                handleDepartmentManagerChange(
                                                                    department.department,
                                                                    event
                                                                        .target
                                                                        .checked
                                                                )
                                                        }
                                                    />
                                                }

                                                label={
                                                    department.manager_enabled
                                                        ? (
                                                            department.manager_name ||
                                                            "Müdir təyin edilməyib"
                                                        )
                                                        : "Söndürülüb"
                                                }
                                            />

                                        </Box>


                                        {/* =================================
                                            ƏVƏZLƏYİCİ
                                        ================================== */}

                                        <Box>

                                            {managerDisabled ? (

                                                <FormControl
                                                    fullWidth
                                                    size="small"
                                                >

                                                    <Select
                                                        value={
                                                            department.replacement_user
                                                                ? String(
                                                                    department.replacement_user
                                                                )
                                                                : ""
                                                        }

                                                        displayEmpty

                                                        onChange={
                                                            (event) =>
                                                                handleReplacementChange(
                                                                    department.department,
                                                                    event.target.value
                                                                )
                                                        }

                                                        sx={{
                                                            fontSize: 12.5,

                                                            borderRadius:
                                                                "8px",
                                                        }}
                                                    >

                                                        <MenuItem
                                                            value=""
                                                        >
                                                            Əvəzləyici seçin
                                                        </MenuItem>


                                                        {departmentUsers.map(
                                                            (user) => (

                                                                <MenuItem
                                                                    key={
                                                                        user.id
                                                                    }

                                                                    value={
                                                                        String(
                                                                            user.id
                                                                        )
                                                                    }
                                                                >

                                                                    {
                                                                        user.name
                                                                    }

                                                                    {user.role_name
                                                                        ? ` — ${user.role_name}`
                                                                        : ""}

                                                                </MenuItem>

                                                            )
                                                        )}

                                                    </Select>

                                                </FormControl>

                                            ) : (

                                                <Typography
                                                    sx={{
                                                        fontSize: 12,

                                                        color:
                                                        colors.lightText,
                                                    }}
                                                >
                                                    Əvəzləyici
                                                    tələb olunmur
                                                </Typography>

                                            )}

                                        </Box>


                                        {/* =================================
                                            SAVE
                                        ================================== */}

                                        <Button
                                            variant="outlined"

                                            size="small"

                                            disabled={
                                                isSaving
                                            }

                                            onClick={() =>
                                                saveDepartment(
                                                    department
                                                )
                                            }

                                            startIcon={
                                                isSaving ? (
                                                    <CircularProgress
                                                        size={14}
                                                    />
                                                ) : (
                                                    <SaveOutlinedIcon
                                                        sx={{
                                                            fontSize: 16,
                                                        }}
                                                    />
                                                )
                                            }

                                            sx={{
                                                height: 36,

                                                borderColor:
                                                colors.borderDark,

                                                color:
                                                colors.text,

                                                borderRadius:
                                                    "8px",

                                                textTransform:
                                                    "none",

                                                fontSize: 12,

                                                whiteSpace:
                                                    "nowrap",

                                                "&:hover": {
                                                    borderColor:
                                                    colors.gold,

                                                    color:
                                                    colors.gold,

                                                    backgroundColor:
                                                        "transparent",
                                                },
                                            }}
                                        >
                                            {isSaving
                                                ? "Saxlanılır..."
                                                : "Yadda saxla"}
                                        </Button>


                                        {/* =================================
                                            WARNING
                                        ================================== */}

                                        {managerDisabled && (

                                            <Box
                                                sx={{
                                                    gridColumn: {
                                                        xs: "1",
                                                        md: "2 / 4",
                                                    },

                                                    mt: -0.5,
                                                }}
                                            >

                                                <Typography
                                                    sx={{
                                                        fontSize: 11.5,

                                                        color:
                                                            "#9A762A",
                                                    }}
                                                >
                                                    Şöbə müdiri
                                                    söndürülüb.
                                                    Əvəzləyici şəxs
                                                    seçilməlidir.
                                                </Typography>

                                            </Box>

                                        )}

                                    </Box>

                                );

                            }
                        )

                    )}

                </Paper>

            </Box>


            {/* =========================================================
                ERROR SNACKBAR
            ========================================================== */}

            <Snackbar
                open={
                    !!error
                }

                autoHideDuration={5000}

                onClose={() =>
                    setError("")
                }

                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >

                <Alert
                    severity="error"
                    variant="filled"

                    onClose={() =>
                        setError("")
                    }
                >
                    {error}
                </Alert>

            </Snackbar>


            {/* =========================================================
                SUCCESS SNACKBAR
            ========================================================== */}

            <Snackbar
                open={
                    !!success
                }

                autoHideDuration={3000}

                onClose={() =>
                    setSuccess("")
                }

                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
            >

                <Alert
                    severity="success"
                    variant="filled"

                    onClose={() =>
                        setSuccess("")
                    }
                >
                    {success}
                </Alert>

            </Snackbar>

        </Box>
    );
}


/*
|--------------------------------------------------------------------------
| TABLE HEADER STYLE
|--------------------------------------------------------------------------
*/

const tableHeaderStyle = {
    fontSize: 10.5,

    fontWeight: 600,

    color: colors.lightText,

    textTransform: "uppercase",

    letterSpacing: "0.05em",
};