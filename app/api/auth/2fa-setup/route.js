'use server'
import {cookies} from "next/headers";
import {get_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const res = await get_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.TWO_FA_SETUP, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        console.log('exc is -> ', e)
        return Response.json(handleError(e), {status: 500})
    }
}
