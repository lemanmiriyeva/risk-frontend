import axios from 'axios'
import {redirect} from 'next/navigation'
import {APP_ROUTES} from "@/components/constants";
import {require_login} from "@/app/utils";


export const service_api = axios.create({
    baseURL: '/api/',
    timeout: 50000,
    withCredentials: true,
    headers: {'X-Custom-Header': 'foobar'}
});

service_api.interceptors.request.use(function (config) {
    return config;
}, function (error) {
    return Promise.reject(error);
})

service_api.interceptors.response.use(function (res) {
    return res;
}, function (error) {
    console.log("error: ", error.status);

    const isSigninRequest = error?.config?.url?.includes('auth/signin');

    if (error.status === 401) {
        if (require_login(window?.location.pathname)) {
            window.location.href = APP_ROUTES.SIGNIN
        }
    }
    if (error.status === 403 && !isSigninRequest) {
        window.location.href = APP_ROUTES.HOME
    }
    return Promise.reject(error);
})