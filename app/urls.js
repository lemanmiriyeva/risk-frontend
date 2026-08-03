export const API_URL =process.env.NEXT_PUBLIC_API_URL

export const DJANGO_API_ENDPOINTS = {
    AUTHENTICATION: {
        USER: API_URL + "/api/authentication/user/",
        USER_LIST: API_URL + "/api/authentication/user/list/",
        TOKEN: API_URL + "/api/authentication/token/",
        REFRESH: API_URL + "/api/authentication/token/refresh/",
        LOGOUT: API_URL + "/api/authentication/user/logout/",
        REQUEST_RESET: API_URL + "/api/authentication/user/request-password-reset/",
        RESET: API_URL + "/api/authentication/user/password-reset/",
        DEPARTMENTS: API_URL + "/api/authentication/departments/",
        TWO_FA_SETUP: API_URL + "/api/authentication/2fa/setup/",
        TWO_FA_VERIFY: API_URL + "/api/authentication/2fa/verify/",
        ROLES: API_URL + "/api/authentication/roles/",
    },
    RISK: {
        LIST: API_URL + "/api/risk/",
        DETAIL: API_URL + "/api/risk/",
        LOGS: API_URL + "/api/risk/logs/",
        EXPORT_LOG: API_URL + "/api/risk/export-log/"
    },

    ACTIVITY_LOGS: {
        LIST: API_URL + "/api/activity-logs/",
    },

    CORE:{
        MODULES: API_URL + "/api/modules/",
        STATUS: API_URL + "/api/status/",
        CHECK_MODULE_ACCESS: API_URL + '/api/check-module-access/',
        ORG_MODULE_ACCESS: API_URL + "/api/organization/module-access/",
    },

    ORGANIZATION: {
        LIST: API_URL + "/api/authentication/organizations/",
        USERS: API_URL + "/api/authentication/organization/users/",
    },
    INVENTORY: {
        LIST: API_URL + "/api/inventory/",
        DETAIL: API_URL + "/api/inventory/",
        SEARCH_PERSONS: API_URL + "/api/inventory/owners/persons/",
        SEARCH_DEPARTMENTS: API_URL + "/api/inventory/owners/departments/",
    },

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
        ROLES: 'auth/roles/',
    },
    RISK:{
        LIST:"risk/",
        DETAIL:"risk/",
        LOGS:"risk/logs/",
        EXPORT_LOG: 'risk/export-log/',

    },

    ACTIVITY_LOGS: {
        LIST: "activity-logs/",
    },

    CORE:{
        MODULES: "modules/",
        STATUS: "status/",
        CHECK_MODULE_ACCESS: 'check-module-access/',
        ORG_MODULE_ACCESS: "organization/module-access/",
    },

    ORGANIZATION: {
        LIST: "organization/list/",
        USERS: "organization/users/",
    },

    INVENTORY: {
        LIST: "inventory/",
        DETAIL: "inventory/",
        SEARCH_PERSONS: "inventory/owners/persons/",
        SEARCH_DEPARTMENTS: "inventory/owners/departments/",
    },

}