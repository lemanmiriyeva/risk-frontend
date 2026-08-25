'use server'

import {get_request, patch_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";


export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await get_request(
            DJANGO_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.CONFIG,
            access,
            refresh
        )
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))

        return Response.json(
            handleError(e),
            {status: 500}
        );
    }
}


export async function PATCH(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const data = await request.json()

    try {
        return await patch_request(
            DJANGO_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.CONFIG,
            data,
            access,
            refresh
        )
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))

        return Response.json(
            handleError(e),
            {status: 500}
        );
    }
}