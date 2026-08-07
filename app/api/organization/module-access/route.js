'use server'

import {get_request, post_request} from "app/api/utils";
import {DJANGO_API_ENDPOINTS} from "app/urls";
import {handleError} from "app/utils";

export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    const {searchParams} = new URL(request.url)
    const query = searchParams.toString()
    const url = DJANGO_API_ENDPOINTS.CORE.ORG_MODULE_ACCESS + (query ? `?${query}` : '')

    try {
        return await get_request(url, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}

export async function POST(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const data = await request.json()

    try {
        return await post_request(DJANGO_API_ENDPOINTS.CORE.ORG_MODULE_ACCESS, data, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}