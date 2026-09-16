'use server'

import {get_request, post_request} from "app/api/utils";
import {DJANGO_API_ENDPOINTS} from "app/urls";
import {handleError} from "app/utils";

export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await get_request(DJANGO_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_PERIODS, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        return Response.json(handleError(e), {status: 500});
    }
}

export async function POST(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        const data = await request.json()
        return await post_request(DJANGO_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_PERIODS, data, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        return Response.json(handleError(e), {status: 500})
    }
}
