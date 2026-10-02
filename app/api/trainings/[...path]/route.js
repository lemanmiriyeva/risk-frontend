'use server'

import {
    delete_request,
    get_request,
    patch_form_request,
    patch_request,
    post_form_request,
    post_request,
    put_request,
} from "app/api/utils";
import {DJANGO_API_ENDPOINTS} from "app/urls";
import {handleError} from "app/utils";

/*
 * Təlimlər modulu üçün ümumi proxy: /api/trainings/<path>/ -> Django /api/trainings/<path>/
 *
 * Modulda endpoint çoxdur (materiallar, baxış izlənməsi, quiz, rəy, statistika),
 * ona görə hər biri üçün ayrıca route faylı yazmaq əvəzinə bir catch-all route
 * istifadə olunur. Yalnız hərf/rəqəm/tire/alt xətt seqmentlərinə icazə verilir.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

function buildUrl(request, params) {
    const segments = params?.path || [];
    if (!segments.length || !segments.every((s) => SAFE_SEGMENT.test(s))) {
        return null;
    }
    const {searchParams} = new URL(request.url);
    const query = searchParams.toString();
    return DJANGO_API_ENDPOINTS.TRAININGS.BASE + segments.join('/') + '/' + (query ? `?${query}` : '');
}

function badPath() {
    return Response.json({detail: 'Yanlış ünvan.'}, {status: 400});
}

function tokens(request) {
    return [request.cookies.get('access'), request.cookies.get('refresh')];
}

async function readJson(request) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

export async function GET(request, {params}) {
    const url = buildUrl(request, params);
    if (!url) return badPath();
    const [access, refresh] = tokens(request);
    try {
        // Excel ixracı kimi binar cavablar da olduğu kimi ötürülür.
        return await get_request(url, access, refresh);
    } catch (e) {
        console.log('exc is -> ', e);
        return Response.json(handleError(e), {status: 500});
    }
}

export async function POST(request, {params}) {
    const url = buildUrl(request, params);
    if (!url) return badPath();
    const [access, refresh] = tokens(request);
    const contentType = request.headers.get('content-type') || '';
    try {
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            return await post_form_request(url, formData, access, refresh);
        }
        return await post_request(url, await readJson(request), access, refresh);
    } catch (e) {
        console.log('exc is -> ', e);
        return Response.json(handleError(e), {status: 500});
    }
}

export async function PUT(request, {params}) {
    const url = buildUrl(request, params);
    if (!url) return badPath();
    const [access, refresh] = tokens(request);
    try {
        return await put_request(url, await readJson(request), access, refresh);
    } catch (e) {
        console.log('exc is -> ', e);
        return Response.json(handleError(e), {status: 500});
    }
}

export async function PATCH(request, {params}) {
    const url = buildUrl(request, params);
    if (!url) return badPath();
    const [access, refresh] = tokens(request);
    const contentType = request.headers.get('content-type') || '';
    try {
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            return await patch_form_request(url, formData, access, refresh);
        }
        return await patch_request(url, await readJson(request), access, refresh);
    } catch (e) {
        console.log('exc is -> ', e);
        return Response.json(handleError(e), {status: 500});
    }
}

export async function DELETE(request, {params}) {
    const url = buildUrl(request, params);
    if (!url) return badPath();
    const [access, refresh] = tokens(request);
    try {
        return await delete_request(url, access, refresh);
    } catch (e) {
        console.log('exc is -> ', e);
        return Response.json(handleError(e), {status: 500});
    }
}
