import {cookies} from "next/headers";
import {get_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(request, {params}) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    console.log("params: ", params)
    const id = params.id
    try {
        return await get_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.DEPARTMENTS + id, access, refresh)

    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json(handleError(e), {status: 500})
    }
}