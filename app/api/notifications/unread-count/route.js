'use server'

import {get_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await get_request(DJANGO_API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500});
    }
}