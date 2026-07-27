'use server'

import {get_request, post_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    const {searchParams} = new URL(request.url)
    const query = searchParams.toString()
    const url = DJANGO_API_ENDPOINTS.RISK.LIST + (query ? `?${query}` : '')

    try {
        return await get_request(url, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500});
    }
}

export async function POST(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const data = await request.json()

    try {
        return await post_request(DJANGO_API_ENDPOINTS.RISK.LIST, data, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500})
    }
}