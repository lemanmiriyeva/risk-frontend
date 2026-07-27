'use server'
import {cookies} from "next/headers";
import {handleError} from "@/app/utils";
import {parseJwt, post_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {LOGIN_SUCCESSFUL} from "@/components/constants";

export async function POST(req) {
    // Perform sign-in logic here, and obtain the token
    // Obtain username and password from request body
    const {username, password} = await req.json();
    try {

        // request backend
        const _res = await post_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.TOKEN, {username, password})

        if (_res.status === 200) {
            // get response cookies
            const data = await _res.json()
            const {access, refresh} = data

            const access_payload = await parseJwt(access)
            const refresh_payload = await parseJwt(refresh)

            // Calculate maxAge (in seconds)
            const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
            const access_max_age = access_payload.exp - currentTimestamp;
            const refresh_max_age = refresh_payload.exp - currentTimestamp;

            cookies().set('access', access, {secure: false, httpOnly: true, maxAge: access_max_age})
            cookies().set('refresh', refresh, {secure: false, httpOnly: true, maxAge: refresh_max_age})

            return Response.json(LOGIN_SUCCESSFUL, {
                status: _res.status
            })

        } else {
            const data = await _res.json()
            console.log('response: ', _res)
            console.log('data: ', data)
            return Response.json(data, {status: _res.status})
        }
    } catch (e) {
        console.log('exc is -> ', e)
        console.log('beautiful error', handleError(e))
        return Response.json('Error', {status: 500})
    }
}
