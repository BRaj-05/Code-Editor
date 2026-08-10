import NextAuth from "next-auth";

// Inlined route constants (originally imported from "./routes").
// Adjust these values if you have a centralized routes file later.
// import {
//   DEFAULT_LOGIN_REDIRECT,
//   apiAuthPrefix,
//   publicRoutes,
//   authRoutes,
// } from "./routes";
const DEFAULT_LOGIN_REDIRECT = "/";
const apiAuthPrefix = "/api/auth";
const publicRoutes: string[] = ["/", "/about", "/pricing"];
const authRoutes: string[] = ["/auth/sign-in", "/auth/sign-up"];
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  //   !! is either true or false,it is used to check if the user is logged in or not. If the user is logged in, it will return true, otherwise false.
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute) {
    return null;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return null;
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/auth/sign-in", nextUrl));
  }

  return null;
});

export const config = {
  // copied from clerk
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
