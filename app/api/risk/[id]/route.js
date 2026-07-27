'use server'

import {delete_request, get_request, patch_request, post_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(request, {params}) {

    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const {id} = params


    try {
        return await get_request(DJANGO_API_ENDPOINTS.RISK.RISK + id, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500});
    }
}

export async function POST(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const data = await request.json()

    try {
        return await post_request(DJANGO_API_ENDPOINTS.RISK.LIST + id + '/', data, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500})
    }

}

export async function PATCH(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const data = await request.json()

    try {
        return await patch_request(DJANGO_API_ENDPOINTS.RISK.LIST + id + '/', data, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500})
    }
}

export async function DELETE(request, {params: {id}}) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    try {
        return await delete_request(DJANGO_API_ENDPOINTS.RISK.LIST + id, access, refresh)
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500});
    }
}