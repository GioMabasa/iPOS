<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = Setting::first();

        if (!$settings) {
            $settings = Setting::create([
                'default_customer' => 'walk-in',
                'currency' => 'PHP',
                'date_format' => 'Y-m-d',
                'timezone' => 'Asia/Manila',
            ]);
        }

        return response()->json([
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'business_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'business_address' => [
                'nullable',
                'string',
            ],

            'contact_number' => [
                'nullable',
                'string',
                'max:50',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'tin' => [
                'nullable',
                'string',
                'max:50',
            ],

            'default_customer' => [
                'required',
                'string',
                'max:255',
            ],

            'currency' => [
                'required',
                'string',
                'max:10',
            ],

            'date_format' => [
                'required',
                'string',
                'max:50',
            ],

            'timezone' => [
                'required',
                'string',
                'max:100',
            ],
        ]);

        $settings = Setting::first();

        if (!$settings) {
            $settings = Setting::create($validated);
        } else {
            $settings->update($validated);
        }

        return response()->json([
            'message' => 'Settings updated successfully.',
            'data' => $settings->fresh(),
        ]);
    }
}
