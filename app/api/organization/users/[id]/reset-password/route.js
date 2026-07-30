'use server'

import {post_request} from "app/api/utils";
import {DJANGO_API_ENDPOINTS} from "app/urls";
import {handleError} from "app/utils";

export async function POST(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await post_request(DJANGO_API_ENDPOINTS.ORGANIZATION.USERS + id + '/reset-password/', {}, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}