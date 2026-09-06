<?php

namespace App\Modules\Auth\Controllers;

use App\Modules\Auth\Models\User;
use App\Modules\Auth\Requests\LoginRequest;
use App\Modules\Shared\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login admin dan terbitkan personal access token (Sanctum).
     */
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau kata sandi salah.'],
            ]);
        }

        $token = $user->createToken('admin-dashboard')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Cabut token yang sedang dipakai (logout).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(null, 204);
    }

    /**
     * Data admin yang sedang login.
     */
    public function me(Request $request)
    {
        return response()->json([
            'data' => $request->user()->only(['id', 'name', 'email']),
        ]);
    }
}
