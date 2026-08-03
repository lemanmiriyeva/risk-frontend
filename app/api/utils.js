'use server'
import {cookies, headers as nextHeaders} from "next/headers";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError, isEmpty} from "@/app/utils";
import {ACCESS_TOKEN_COOKIE, INVOICE_FILTERS, REFRESH_TOKEN_COOKIE} from "@/components/constants";

const METHODS = {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE",
}

function getClientIp() {
    // Next.js server-inin qarşısında olan reverse proxy (nginx və s.)
    // real istifadəçi IP-sini bu header-lərdə ötürür. Heç biri yoxdursa
    // (məs. lokal dev mühitində, birbaşa qoşulanda), boş qaytarılır.
    const h = nextHeaders();
    const forwardedFor = h.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return h.get('x-real-ip') || '';
}

const __refresh = async (headers, refresh_token) => {
    console.log('refresh called ')
    const refresh_res = await post_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.REFRESH,
        {'refresh': refresh_token}, null, refresh_token, headers)
    if (refresh_res.ok) {
        console.log('token refreshed!')
        const {access, refresh} = await refresh_res.json()
        const access_payload = await parseJwt(access)
        const refresh_payload = await parseJwt(refresh)

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const access_max_age = access_payload.exp - currentTimestamp;
        const refresh_max_age = refresh_payload.exp - currentTimestamp;

        cookies().set(ACCESS_TOKEN_COOKIE, access, {secure: false, httpOnly: true, maxAge: access_max_age})
        cookies().set(REFRESH_TOKEN_COOKIE, refresh, {secure: false, httpOnly: true, maxAge: refresh_max_age})

        return {access, refresh}
    } else {
        throw Error('refresh_not_valid')
    }
}

async function __base_request(url, method, data = {}, access_token, refresh_token, headers) {

    const standart_headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    const combined_headers = {
        ...standart_headers,
        ...headers,
    }
    const _headers = new Headers({...combined_headers})
    if (access_token?.value) {
        _headers.set('Authorization', 'Bearer ' + access_token.value)
    }

    // Real istifadəçi IP-sini Django-ya ötürürük
    const clientIp = getClientIp();
    if (clientIp) {
        _headers.set('X-Forwarded-For', clientIp);
    }

    const config = {
        headers: _headers,
        method,
        body: JSON.stringify(data)
    }
    if (method === METHODS.GET || isEmpty(data))
        delete config.body
    const res = await fetch(url, config)
    if (res.status === 401 && refresh_token?.value) {
        try {
            const new_token_pair = await __refresh(standart_headers, refresh_token.value)
            if (new_token_pair?.access) {
                _headers.set('Authorization', 'Bearer ' + new_token_pair.access)
                try {
                    const response = await fetch(url, {
                        ...config,
                        headers: _headers
                    })
                    console.log(response.statusText)
                    return response
                } catch (e) {
                    console.log(e)
                    return Response.json(handleError(e), {status: 500})
                }
            } else {
                cookies().delete('access')
                cookies().delete('refresh')
                return Response.json(handleError(e), {status: 401})
            }
        } catch (e) {
            if (e.message === 'refresh_not_valid') {
                console.log('Refresh token is expired')
                cookies().delete('access')
                cookies().delete('refresh')
            }
            return Response.json(handleError(e), {status: 401})
        }
    } else if (!refresh_token?.value) {
        cookies().delete('access')
        cookies().delete('refresh')
    }
    return res
}

export async function get_request(url, access_token, refresh_token, headers = {}) {
    return await __base_request(url, METHODS.GET, null, access_token, refresh_token, headers)
}

export async function post_request(url, data, access_token, refresh_token, headers = {}) {
    return await __base_request(url, METHODS.POST, data, access_token, refresh_token, headers)
}

export async function put_request(url, data, access_token, refresh_token, headers = {}) {
    return await __base_request(url, METHODS.PUT, data, access_token, refresh_token, headers)
}

export async function patch_request(url, data, access_token, refresh_token, headers = {}) {
    return await __base_request(url, METHODS.PATCH, data, access_token, refresh_token, headers)
}

export async function delete_request(url, access_token, refresh_token, headers = {}) {
    return await __base_request(url, METHODS.DELETE, null, access_token, refresh_token, headers)
}

export async function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}