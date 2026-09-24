<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Rent',
                'description' => 'Store, office, or business space rent.',
            ],
            [
                'name' => 'Electricity',
                'description' => 'Electricity and power-related expenses.',
            ],
            [
                'name' => 'Water',
                'description' => 'Water and water service expenses.',
            ],
            [
                'name' => 'Internet',
                'description' => 'Internet service expenses.',
            ],
            [
                'name' => 'Telephone',
                'description' => 'Telephone and communication expenses.',
            ],
            [
                'name' => 'Salaries/Wages',
                'description' => 'Employee salaries, wages, and related expenses.',
            ],
            [
                'name' => 'Transportation',
                'description' => 'Transportation and travel-related business expenses.',
            ],
            [
                'name' => 'Office Supplies',
                'description' => 'Office supplies and other office-related materials.',
            ],
            [
                'name' => 'Cleaning Supplies',
                'description' => 'Cleaning materials and sanitation supplies.',
            ],
            [
                'name' => 'Repairs & Maintenance',
                'description' => 'Repairs, maintenance, and servicing expenses.',
            ],
            [
                'name' => 'Delivery',
                'description' => 'Delivery, shipping, and courier expenses.',
            ],
            [
                'name' => 'Government Fees',
                'description' => 'Permits, registrations, licenses, and government-related fees.',
            ],
            [
                'name' => 'Bank/Payment Fees',
                'description' => 'Bank charges and payment processing fees.',
            ],
            [
                'name' => 'Others',
                'description' => 'Other business expenses that do not fit the available categories.',
            ],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::updateOrCreate(
                ['name' => $category['name']],
                [
                    'description' => $category['description'],
                    'is_active' => true,
                ]
            );
        }
    }
}
