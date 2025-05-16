import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export enum DefaultRole {
  SUPER_ADMIN = 'super_admin',
  ADMINISTRATOR = 'administrator',
  USER = 'user',
}

// Interface for the role verification API response
interface VerifyRoleResponse {
  role?: {
    name: string;
  };
  // Add other relevant fields your API might return
}

// Interface for the lecture access check API response
interface VerifyLectureAccessResponse {
  hasAccess: boolean;
  isPreviewable: boolean;
  lecture?: {
    id: string;
    name: string;
  };
  course?: {
    id: string;
    title: string;
    progress: number;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth_token')?.value;
  const unauthorizedUrl = new URL('/unauthorized', request.url);
  const unaccessibleUrl = new URL('/unaccessible', request.url);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  // --- Admin Route Check ---
  if (pathname.startsWith('/admin')) {
    console.log('Middleware: Checking admin route:', pathname);
    const backendVerifyRoleUrl = `${apiBaseUrl}/role/user-role-and-permission`;

    // Early return if no token
    if (!token) {
      console.log('Middleware (Admin): No token found, redirecting to unauthorized.');
      return NextResponse.redirect(unauthorizedUrl);
    }

    try {
      const response = await fetch(backendVerifyRoleUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Early return if backend verification fails
      if (!response.ok) {
        console.error(`Middleware (Admin): Backend role verification failed with status ${response.status}`);
        const responseRedirect = NextResponse.redirect(unauthorizedUrl);
        responseRedirect.cookies.delete('auth_token'); // Clear potentially invalid cookie
        return responseRedirect;
      }

      const verificationData = (await response.json()) as VerifyRoleResponse;
      const roleName = verificationData.role?.name?.toLowerCase();

      // Early return if role is unauthorized for admin section
      if (!roleName || (roleName !== DefaultRole.ADMINISTRATOR && roleName !== DefaultRole.SUPER_ADMIN)) {
        console.log(`Middleware (Admin): Role '${roleName || 'none'}' is unauthorized for admin access, redirecting.`);
        return NextResponse.redirect(unauthorizedUrl);
      }

      // Role is valid and authorized for admin
      console.log(`Middleware (Admin): Role '${roleName}' authorized.`);
      return NextResponse.next(); // Allow access

    } catch (error) {
      console.error('Error in admin middleware during backend verification:', error);
      const responseRedirect = NextResponse.redirect(unauthorizedUrl);
      responseRedirect.cookies.delete('auth_token'); // Clear potentially invalid cookie on error
      return responseRedirect;
    }
  }

  if (pathname.startsWith('/api/gcs-delete') || pathname.startsWith('/api/gcs-upload')) {
    try {
      if (!token) {
        console.log('Middleware (GCS): No token found, redirecting to unauthorized.');
        return NextResponse.redirect(unauthorizedUrl);
      }
      return NextResponse.next(); // Allow access to GCS API routes
    }
    catch (error) {
      console.error('Error in API middleware during backend verification:', error);
      const responseRedirect = NextResponse.redirect(unauthorizedUrl);
      responseRedirect.cookies.delete('auth_token'); // Clear potentially invalid cookie on error
    }

  }
  // --- Lecture Route Access Check ---
  // Check if path looks like /courses/{id}/lectures/{slug}
  const pathSegments = pathname.split('/').filter(segment => segment.length > 0); // Filter out empty segments
  const isLectureRoute =
    pathSegments.length === 4 && // Expecting ['', 'courses', '{id}', 'lectures', '{slug}'] -> 4 non-empty segments
    pathSegments[0] === 'courses' &&
    pathSegments[2] === 'lectures';
  if (isLectureRoute
     //|| pathname.startsWith('/learning')
    ) {
    const lectureSlug = pathSegments[3]; // The slug should be the 4th segment (index 3)
    console.log(`Middleware: Checking lecture access for slug: ${lectureSlug}`);
    const backendVerifyLectureAccessUrl = `${apiBaseUrl}/user-course/check-access/lecture/${lectureSlug}`;

    // Early return if no token for lecture route
    if (!token) {
      console.log('Middleware (Lecture): No token found, redirecting to login.');
      return NextResponse.redirect(unaccessibleUrl);
    }

    try {
      const response = await fetch(backendVerifyLectureAccessUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Early return if backend check fails
      if (!response.ok) {
        console.error(`Middleware (Lecture): Backend access check failed with status ${response.status}`);
        // Consider redirecting to course page or a more specific error page
        return NextResponse.redirect(unaccessibleUrl);
      }

      const accessData = (await response.json()) as VerifyLectureAccessResponse;

      // Early return if user doesn't have access
      if (!accessData.hasAccess) {
        console.log(`Middleware (Lecture): User does not have access to lecture slug: ${lectureSlug}. Redirecting.`);
        // Consider redirecting to course page instead of generic unauthorized
        // Example: return NextResponse.redirect(new URL(`/courses/${pathSegments[1]}`, request.url));
        return NextResponse.redirect(unaccessibleUrl);
      }

      // User has access, allow the request
      console.log(`Middleware (Lecture): User has access to lecture slug: ${lectureSlug}.`);
      return NextResponse.next();

    } catch (error) {
      console.error('Error in lecture access middleware during backend verification:', error);
      return NextResponse.redirect(unaccessibleUrl); // Redirect on unexpected errors
    }
  }

  // --- Default: Allow other routes ---
  // If the route didn't match /admin or the lecture pattern, allow it by default
  // console.log('Middleware: Route does not require specific checks:', pathname);
  return NextResponse.next();
}

// The new middleware matcher configuration format
export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - login (login page)
   * - register (register page)
   * - unauthorized (unauthorized page)
   * - assets (public assets folder)
   * - images (public images folder)
   * Add any other public paths or static resource paths here.
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|unauthorized|assets|images).*)',
  ],
};