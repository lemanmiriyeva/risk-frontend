'use server'
import {post_request} from "@/app/api/utils";
import {handleError} from "@/app/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";

export async function POST(request) {
    const data = await request.json();
    try {
        return await post_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.TWO_FA_RESET_CONFIRM, data)
    } catch (error) {
        console.log('exc is -> ', error)
        return Response.json(handleError(error), {status: 500});
    }
}
