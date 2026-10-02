

// import { baseApi } from "../../api/baseApi";
// import type { User } from "../auth/auth.types";

// interface SingleUserResponse {
//   success: boolean;
//   message: string;
//   data: User;
// }

// interface UsersResponse {
//   success: boolean;
//   message: string;
//   data: User[];
// }

// interface UpdateProfileRequest {
//   name?: string;
//   bio?: string;
// }

// export const userApi = baseApi.injectEndpoints({
//   endpoints: (builder) => ({
//     // =========================
//     // Get Single User
//     // =========================

    

//     // =========================
//     // Search Users
//     // =========================

//     searchUsers: builder.query<User[], string>({
//       query: (query) => ({
//         url: "/users/search",
//         method: "GET",
//         params: {
//           query,
//         },
//       }),

//       transformResponse: (
//         response: UsersResponse,
//       ) => {
//         return response.data;
//       },
//     }),

    
  
     
//   }),
// });

// export const {
   
//   useSearchUsersQuery,
  
// } = userApi;