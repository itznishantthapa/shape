export const userInitialState = {
    id: null,
    username: '',
    email: '',
    first_name: ' ',
    last_name: '',
    level: '',
    bio: '',
    profile_pic: '',
  };
export function userReducer(state, action) {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, ...action.payload };
        case 'UPDATE_USER':
            return {
                ...state,
                first_name: action.payload.first_name !== undefined ? action.payload.first_name : state.first_name,
                last_name: action.payload.last_name !== undefined ? action.payload.last_name : state.last_name,
                email: action.payload.email !== undefined ? action.payload.email : state.email,
                username: action.payload.username !== undefined ? action.payload.username : state.username,
                level: action.payload.level !== undefined ? action.payload.level : state.level,
                bio: action.payload.bio !== undefined ? action.payload.bio : state.bio,
                profile_pic: action.payload.profile_pic !== undefined ? action.payload.profile_pic : state.profile_pic,
            };

        case 'RESET_USER':
                return userInitialState;     
        default:
            return state;
    }
}