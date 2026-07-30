'use server'

import {get_request} from "app/api/utils";
import {DJANGO_API_ENDPOINTS} from "app/urls";
import {handleError} from "app/utils";

export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await get_request(DJANGO_API_ENDPOINTS.ORGANIZATION.LIST, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}