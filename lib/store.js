import {configureStore} from '@reduxjs/toolkit'
import userReducer from "@/lib/features/user/userSlice";

export const makeStore = () => {
    return configureStore({
        devTools: true,
        reducer: {
            user: userReducer,
        },
    })
}
