// 'use server'
// import {get_request} from "@/app/api/utils";
// import {DJANGO_API_ENDPOINTS} from "@/app/urls";
// import {handleError} from "@/app/utils";
//
// export async function GET(request) {
//     const access = request.cookies.get('access')
//     const refresh = request.cookies.get('refresh')
//     try {
//         return await get_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.USER_LIST, access, refresh)
//     } catch (error) {
//         console.log('exc is -> ', error)
//         console.log('beautiful error', handleError(error))
//         return Response.json(handleError(error), {status: 500});
//     }
// }
'use server'
import { get_request } from "@/app/api/utils";
import { DJANGO_API_ENDPOINTS } from "@/app/urls";
import { handleError } from "@/app/utils";

export async function GET(request) {
    const access = request.cookies.get('access');
    const refresh = request.cookies.get('refresh');

    try {
        const { searchParams } = new URL(request.url);
        const department = searchParams.get('department');
        const search = searchParams.get('search');

        let url = DJANGO_API_ENDPOINTS.AUTHENTICATION.USER_LIST;

        const params = [];
        if (department) {
            params.push(`department=${encodeURIComponent(department)}`);
        }
        if (search) {
            params.push(`search=${encodeURIComponent(search)}`);
        }
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        return await get_request(url, access, refresh);
    } catch (error) {
        console.log('exc is -> ', error);
        console.log('beautiful error', handleError(error));
        return new Response(JSON.stringify(handleError(error)), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
