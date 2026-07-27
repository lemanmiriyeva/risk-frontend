
export const API_URL =process.env.NEXT_PUBLIC_API_URL

export const DJANGO_API_ENDPOINTS = {
    AUTHENTICATION: {
        USER: API_URL + "/api/authentication/user/",
        USER_LIST: API_URL + "/api/authentication/user/list/",
        TOKEN: API_URL + "/api/authentication/token/",
        REFRESH: API_URL + "/api/authentication/token/refresh/",
        LOGOUT: API_URL + "/api/authentication/user/logout/ ",
        REQUEST_RESET: API_URL + "/api/authentication/user/request-password-reset/ ",
        RESET: API_URL + "/api/authentication/user/password-reset/ ",
        DEPARTMENTS: API_URL + "/api/authentication/departments/",
        TWO_FA_SETUP: API_URL + "/api/authentication/2fa/setup/",
        TWO_FA_VERIFY: API_URL + "/api/authentication/2fa/verify/",
    },
    RISK:{
        LIST:API_URL + "/api/risk/",
        DETAIL:API_URL + "/api/risk/",
        LOGS:API_URL + "/api/risk/logs/",
        EXPORT_LOG: API_URL + "/api/risk/export-log/"

    },

    MODULES: API_URL + "/api/modules/",

}

export const NEXT_API_ENDPOINTS = {
    AUTHENTICATION: {
        USER: 'auth/user/',
        USER_LIST: 'auth/users/',
        SIGNIN: 'auth/signin/',
        SIGNOUT: 'auth/signout/',
        REQUEST_RESET: 'auth/request-password-reset/',
        RESET: 'auth/password-reset/',
        DEPARTMENTS: 'auth/departments/',
        TWO_FA_SETUP: "auth/2fa-setup/",
        TWO_FA_VERIFY: "auth/2fa-verify/",
    },
    RISK:{
        LIST:"risk/",
        DETAIL:"risk/",
        LOGS:"risk/logs/",
        EXPORT_LOG: 'risk/export-log/',

    },
    MODULES: "/modules/",

}