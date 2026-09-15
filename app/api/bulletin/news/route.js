'use server'

import {get_request, post_request, post_form_request} from "app/api/utils";
import {DJANGO_API_ENDPOINTS} from "app/urls";
import {handleError} from "app/utils";

export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    const {searchParams} = new URL(request.url)
    const query = searchParams.toString()
    const url = DJANGO_API_ENDPOINTS.BULLETIN.NEWS + (query ? `?${query}` : '')

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
    const contentType = request.headers.get('content-type') || ''

    try {
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            return await post_form_request(DJANGO_API_ENDPOINTS.BULLETIN.NEWS, formData, access, refresh)
        }
        const data = await request.json()
        return await post_request(DJANGO_API_ENDPOINTS.BULLETIN.NEWS, data, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500})
    }
}