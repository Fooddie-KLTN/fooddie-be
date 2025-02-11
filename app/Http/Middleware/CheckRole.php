<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$role): Response
    {
        if (Auth::check() && Auth::user()->role !== $role) {
            $auth = Auth::user();

            if (!$auth) {
                return response()->json([
                    'message' => 'You are not authorized to access this route'
                ], 403);
            }
            // Kiểm tra xem role của user có phải là admin không
            if ($auth->role === 'admin') {
                return $next($request);
            }
            // Kiểm tra xem role của user có nằm trong danh sách được phép không
            if (in_array($auth->role, $role)) {
                return $next($request);
            }
            // Nếu không có quyền truy cập
        }
        return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);

    }
}
