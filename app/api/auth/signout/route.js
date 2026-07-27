'use server'
import {post_request} from "@/app/api/utils";
import {cookies} from "next/headers";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(request) {
    const access = request.cookies.get('access')
    const refresh = request.cookies.get('refresh')
    try {
        const response = await post_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.LOGOUT, {refresh}, access, refresh)

        cookies().delete("access")
        cookies().delete("refresh")
        return response
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}
