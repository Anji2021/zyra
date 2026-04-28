import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProfileComplete } from "@/lib/profiles/completeness";
import { getProfileForUser } from "@/lib/profiles/queries";
import { getSupabasePublicEnv } from "./env";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export async function updateSession(request: NextRequest) {
  const { url, anonKey, isConfigured } = getSupabasePublicEnv();

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isConfigured) {
    if (request.nextUrl.pathname.startsWith("/app") || request.nextUrl.pathname.startsWith("/onboarding")) {
      const redirect = NextResponse.redirect(new URL("/?error=config", request.url));
      return redirect;
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && (pathname.startsWith("/app") || pathname.startsWith("/onboarding"))) {
    const next = NextResponse.redirect(new URL("/?auth=required", request.url));
    copyCookies(supabaseResponse, next);
    return next;
  }

  if (user) {
    const needsProfileCheck =
      pathname === "/" || pathname.startsWith("/app") || pathname.startsWith("/onboarding");

    if (needsProfileCheck) {
      const profile = await getProfileForUser(supabase, user.id);
      const complete = isProfileComplete(profile);

      if (complete && pathname.startsWith("/onboarding")) {
        const next = NextResponse.redirect(new URL("/app", request.url));
        copyCookies(supabaseResponse, next);
        return next;
      }

      if (!complete && pathname.startsWith("/app")) {
        const next = NextResponse.redirect(new URL("/onboarding", request.url));
        copyCookies(supabaseResponse, next);
        return next;
      }

      if (!complete && pathname === "/") {
        const next = NextResponse.redirect(new URL("/onboarding", request.url));
        copyCookies(supabaseResponse, next);
        return next;
      }

      if (complete && pathname === "/") {
        const next = NextResponse.redirect(new URL("/app", request.url));
        copyCookies(supabaseResponse, next);
        return next;
      }
    }
  }

  return supabaseResponse;
}
