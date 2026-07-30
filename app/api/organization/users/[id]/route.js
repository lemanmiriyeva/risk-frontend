'use server'

import {get_request, patch_request} from "app/api/utils";
import {DJANGO_API_ENDPOINTS} from "app/urls";
import {handleError} from "app/utils";

export async function GET(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    const {searchParams} = new URL(request.url)
    const query = searchParams.toString()
    const url = DJANGO_API_ENDPOINTS.ORGANIZATION.USERS + id + '/' + (query ? `?${query}` : '')

    try {
        return await get_request(url, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}

export async function PATCH(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const data = await request.json()

    try {
        return await patch_request(DJANGO_API_ENDPOINTS.ORGANIZATION.USERS + id + '/', data, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}