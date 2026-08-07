/*-- CONSTANTS --*/

/* Cookie */
export const ACCESS_TOKEN_COOKIE = "access"
export const REFRESH_TOKEN_COOKIE = "refresh"
export const MODULE_COOKIE = "MODULE_ID"

/*Messages*/
export const LOGIN_SUCCESSFUL = "LOGIN_SUCCESSFUL"

export const PATTERNS = {
    ONLY_DIGIT: /^\d+$/,
    ONLY_TEXT: /^[a-zA-Z]*$/,
    ONLY_TEXT_AZ: /\p{Script=Latin}+/u
}

export const FORM_RULES = {
    REQUIRED: 'Bu sahə doldurulmalıdır',
    MIN: (value, message) => ({
        value,
        message: message || 'Daxil etdiyiniz dəyər doğru deyil'
    }),
    MAX: (value, message) => ({
        value,
        message: message || 'Daxil etdiyiniz dəyər doğru deyil'
    }),
    PATTERN: (pattern, message) => ({
        value: pattern,
        message: message || 'Daxil etdiyiniz dəyər doğru deyil'
    })
}

export const APP_ROUTES = {
    HOME: "/",
    SIGNIN: "/daxilol",
    SIGNOUT: "/chixish",
    PASSWORD_RESET: "/shifre-teyini",
    TWO_FA_SETUP: "/2fa-qurulmasi",
    PENDING_APPROVAL: "/gozleme",
    ORG_ADMIN: "/inzibatci-paneli-idaresi",
    PROFILE: "/sexsi-kabinet",
}

export const DISPLAY_DATE_FORMAT = 'DD MMM YYYY'