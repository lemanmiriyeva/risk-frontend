'use server'

import {delete_request, patch_request} from "app/api/utils";
import {DJANGO_API_ENDPOINTS} from "app/urls";
import {handleError} from "app/utils";

export async function PATCH(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        const data = await request.json()
        return await patch_request(DJANGO_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_PERIOD_DETAIL(id), data, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        return Response.json(handleError(e), {status: 500})
    }
}

export async function DELETE(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await delete_request(DJANGO_API_ENDPOINTS.ATTENDANCE_PERMISSIONS.LEAVE_PERIOD_DETAIL(id), access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        return Response.json(handleError(e), {status: 500});
    }
}
