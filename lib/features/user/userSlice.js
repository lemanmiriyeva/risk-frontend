import {createSlice} from '@reduxjs/toolkit'

const initialState = {isLoaded: false}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => ({...action.payload, isLoaded: true}),
        updateUser: (state, {payload}) => ({...state, ...payload}),
        removeUser: (state, action) => ({...initialState, isLoaded: true}),
    },
})

export const {setUser, updateUser, removeUser} = userSlice.actions
export default userSlice.reducer