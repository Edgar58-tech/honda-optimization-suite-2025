
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Si no hay token, redirigir al login
    if (!req.nextauth.token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Permitir acceso si hay un token válido
        return !!token;
      },
    },
  }
);

// Configurar qué rutas requieren autenticación
export const config = {
  matcher: [
    // Proteger todas las rutas excepto las de autenticación y assets
    '/((?!auth|api/auth|api/test-auth|api/test|_next/static|_next/image|favicon.ico).*)',
  ],
};
