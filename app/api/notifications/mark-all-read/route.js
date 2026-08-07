'use server'

import {patch_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function PATCH(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await patch_request(DJANGO_API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {}, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500});
    }
}