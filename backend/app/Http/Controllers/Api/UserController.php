<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => User::query()
                ->select('id', 'name', 'role')
                ->orderBy('name')
                ->get(),
        ]);
    }
}
