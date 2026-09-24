<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BirSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BirSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $setting = BirSetting::where('is_active', true)->first();

        return response()->json([
            'data' => $setting,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tin' => [
                'required',
                'string',
                'max:20',
            ],

            'branch_code' => [
                'required',
                'string',
                'max:10',
            ],

            'registered_name' => [
                'required',
                'string',
                'max:255',
            ],

            'business_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'business_address' => [
                'required',
                'string',
            ],

            'vat_registered' => [
                'required',
                'boolean',
            ],

            'tax_type' => [
                'required',
                'string',
                'in:vat_inclusive,vat_exclusive,non_vat',
            ],

            'vat_rate' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],

            'invoice_prefix' => [
                'required',
                'string',
                'max:20',
            ],

            'permit_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'permit_date' => [
                'nullable',
                'date',
            ],

            'accreditation_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'accreditation_date' => [
                'nullable',
                'date',
            ],
        ]);

        BirSetting::where('is_active', true)
            ->update(['is_active' => false]);

        $setting = BirSetting::create([
            ...$validated,
            'invoice_current' => 0,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'BIR settings saved successfully.',
            'data' => $setting,
        ], 201);
    }

    public function update(
        Request $request,
        BirSetting $birSetting
    ): JsonResponse {
        $validated = $request->validate([
            'tin' => [
                'required',
                'string',
                'max:20',
            ],

            'branch_code' => [
                'required',
                'string',
                'max:10',
            ],

            'registered_name' => [
                'required',
                'string',
                'max:255',
            ],

            'business_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'business_address' => [
                'required',
                'string',
            ],

            'vat_registered' => [
                'required',
                'boolean',
            ],

            'tax_type' => [
                'required',
                'string',
                'in:vat_inclusive,vat_exclusive,non_vat',
            ],

            'vat_rate' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
            ],

            'invoice_prefix' => [
                'required',
                'string',
                'max:20',
            ],

            'permit_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'permit_date' => [
                'nullable',
                'date',
            ],

            'accreditation_number' => [
                'nullable',
                'string',
                'max:100',
            ],

            'accreditation_date' => [
                'nullable',
                'date',
            ],
        ]);

        $birSetting->update($validated);

        return response()->json([
            'message' => 'BIR settings updated successfully.',
            'data' => $birSetting->fresh(),
        ]);
    }
}
