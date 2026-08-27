'use server'

import {delete_request, get_request, patch_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await get_request(DJANGO_API_ENDPOINTS.ORGANIZATION.DEPARTMENTS + id + '/', access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        return Response.json(handleError(error), {status: 500});
    }
}

export async function PATCH(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const data = await request.json()

    try {
        return await patch_request(DJANGO_API_ENDPOINTS.ORGANIZATION.DEPARTMENTS + id + '/', data, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        return Response.json(handleError(error), {status: 500});
    }
}

export async function DELETE(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')

    try {
        return await delete_request(DJANGO_API_ENDPOINTS.ORGANIZATION.DEPARTMENTS + id + '/', access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        return Response.json(handleError(error), {status: 500});
    }
}