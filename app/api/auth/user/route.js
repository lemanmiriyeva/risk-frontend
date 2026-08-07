'use server'
import {get_request, patch_request, patch_form_request} from "@/app/api/utils";
import {handleError} from "@/app/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";

export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    try {
        return await get_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.USER, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}

export async function PATCH(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    const contentType = request.headers.get('content-type') || ''

    try {
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            return await patch_form_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.USER, formData, access, refresh)
        }
        const data = await request.json();
        return await patch_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.USER, data, access, refresh)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}