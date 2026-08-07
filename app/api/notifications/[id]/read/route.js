'use server'

import {patch_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function PATCH(request, {params}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const {id} = params

    const url = `${DJANGO_API_ENDPOINTS.NOTIFICATIONS.MARK_READ}${id}/read/`

    try {
        return await patch_request(url, {}, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500})
    }
}