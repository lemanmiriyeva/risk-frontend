'use server'
import {post_request} from "@/app/api/utils";
import {handleError} from "@/app/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";

export async function POST(request) {
    const data = await request.json();
    try {
        return await post_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.RESET, data)
    } catch (error) {
        console.log('exc is -> ', error)
        console.log('beautiful error', handleError(error))
        return Response.json(handleError(error), {status: 500});
    }
}
