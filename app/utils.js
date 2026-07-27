import dayjs from "dayjs";
import {APP_ROUTES, DISPLAY_DATE_FORMAT} from "@/components/constants";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";

function isString(e) {
    return typeof e === 'string';
}

export const handleError = e => {
    console.log(typeof e)
    console.log(e)
    switch (typeof e) {
        case 'string':
            return e;
        case 'object':
            if (e?.response?.data) {
                if (isString(e.response.data)) {
                    return e.response.data
                } else if (e.response.data.detail)
                    return e.response.data.detail
                else if (e.response.data.non_field_errors)
                    return e.response.data.non_field_errors[0]
                else {
                    return Object.keys(e?.response?.data)?.map(key => e?.response?.data[key])?.join(' | ')
                }
            } else if (e?.detail) {
                return e.detail
            } else if (e?.message) {
                return e.message
            } else if (e?.statusText) {
                return e.statusText
            } else {
                return Object.keys(e).map(key => e[key]).join(' | ')
            }
        default:
            return 'Xəta baş verdi.'
    }
}

export function isEmpty(value) {
    return value === undefined || value === null || (typeof value === "number" && isNaN(value)) || (typeof value === 'object' && Object.keys(value).length === 0) || (typeof value === 'string' && value.trim().length === 0)
}


function isInstanceofError(e) {
    return e instanceof Error;
}

export function generate_cookie_text(key, val, exmins = 1) { // 1440 -> 1day
    if (isEmpty(key) || isEmpty(val))
        return ''
    const d = new Date();
    d.setTime(d.getTime() + (exmins * 60 * 1000));
    const expires = d.toUTCString();
    return key + "=" + val + ";" + "expires=" + expires + ";path=/";
}

export function setHeaders(token) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `TOKEN ${token}`
    }
}

export const setParams = (params) => {
    if (isEmpty(params))
        return ''
    const paramsArr = ['?']
    Object.keys(params).forEach(function (value, index, array) {
        paramsArr.push(`${value}=`)
        paramsArr.push(`${params[value]}&`)
    })
    return paramsArr.join('')
}

export function keepSearchParams(searchParams, link) {
    const {redirect_url, edit} = searchParams
    if (redirect_url || edit) {
        let url = link + '?';
        for (const key in searchParams) {
            url += `${key}=${searchParams[key]}`
            if (searchParams[key] !== searchParams[searchParams.length - 1]) { // last one
                url += '&'
            }
        }
        return url
    }
    return link
}

export function toDateFormat(date) {
    try {
        if (isEmpty(date))
            return ''
        return dayjs(date).format(DISPLAY_DATE_FORMAT)
    } catch (e) {
        console.log(e)
        return date
    }
}

export function getPageAndFilterData(url = '', page, limit, query) {
    return new Promise(async (resolve, reject) => {
        let _url = ''.concat(url, '?page=', page, '&limit=', limit)
        let queryString = ''
        if (query) {
            for (let i = 0; i <= Object.keys(query).length - 1; i++) {
                if (query[Object.keys(query)[i]]) {
                    queryString += '&' + Object.keys(query)[i] + '=' + query[Object.keys(query)[i]]
                }
            }
        }
        // console.log('url: ', url)
        // console.log('queryString: ', queryString)
        try {
            const res = await service_api.get(_url + queryString)
            if (res.status === 200) {
                resolve(res.data)
            } else {
                reject(res.statusText)
            }
        } catch (e) {
            console.log(e)
            reject(e)
        }
    })
}

const require_login_exception_list = [
    APP_ROUTES.PASSWORD_RESET,
    APP_ROUTES.SIGNIN,
]

export function require_login(pathname) {
    return require_login_exception_list.filter(path => {
        const pattern = new RegExp(`^${path}(/[^/]+)?$`);
        return pattern.test(pathname)
    }).length === 0
}

export function formatPrice(price) {
    if (!price)
        return ''
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: "AZN", currencyDisplay: 'narrowSymbol' }).format(
        price,
    )
}

// Səhifə baxışlarını / modullar arası keçidləri backend loquna göndərir.
// "page" - risk_list | risk_table | risk_logs | home | module_nav
export async function logPageView(page, extra = {}) {
    try {
        await service_api.post(NEXT_API_ENDPOINTS.RISK.VIEW_LOG, {page, extra});
    } catch (e) {
        console.log('Baxış logu göndərilmədi:', e);
    }
}