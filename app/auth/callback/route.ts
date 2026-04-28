import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { isProfileComplete } from "@/lib/profiles/completeness";
import { getProfileForUser } from "@/lib/profiles/queries";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

function redirectWithCookies(
  target: URL,
  pendingCookies: { name: string; value: string; options: CookieOptions }[],
) {
  const response = NextResponse.redirect(target);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  if (oauthError) {
    const message = oauthErrorDescription || oauthError;
    console.error("[auth/callback] OAuth provider error:", oauthError, oauthErrorDescription);
    return NextResponse.redirect(
      new URL(
        `/?error=auth&message=${encodeURIComponent(message)}`,
        origin,
      ),
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    console.error("[auth/callback] Missing ?code= (user may have cancelled or the link expired).");
    return NextResponse.redirect(
      new URL(
        `/?error=auth&message=${encodeURIComponent("Sign-in was not completed. Please try again.")}`,
        origin,
      ),
    );
  }

  const { url, anonKey, isConfigured } = getSupabasePublicEnv();
  if (!isConfigured) {
    console.error("[auth/callback] Supabase env not configured.");
    return NextResponse.redirect(new URL("/?error=config", origin));
  }

  /**
   * Collect Set-Cookie directives from Supabase, then attach them to the final redirect.
   * Using `cookies()` from `next/headers` here often fails to attach cookies to a
   * `NextResponse.redirect()` in App Router route handlers — session never persists.
   */
  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options: options ?? {} });
        });
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError.message, exchangeError);
    return NextResponse.redirect(
      new URL(
        `/?error=auth&message=${encodeURIComponent(exchangeError.message)}`,
        origin,
      ),
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[auth/callback] No session after exchange:", userError?.message ?? "no user");
    return NextResponse.redirect(
      new URL(
        `/?error=auth&message=${encodeURIComponent("Could not establish your session. Please try signing in again.")}`,
        origin,
      ),
    );
  }

  let destinationPath: string;
  try {
    const profile = await getProfileForUser(supabase, user.id);
    destinationPath = isProfileComplete(profile) ? "/app" : "/onboarding";
  } catch (e) {
    console.error("[auth/callback] Profile lookup failed:", e);
    destinationPath = "/onboarding";
  }

  const target = new URL(destinationPath, origin);
  return redirectWithCookies(target, pendingCookies);
}
