<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Settings
        |--------------------------------------------------------------------------
        */

        $totalProducts = 1000;
        $batchSize = 100;

        /*
        |--------------------------------------------------------------------------
        | Product Name Parts
        |--------------------------------------------------------------------------
        */

        $prefixes = [
            'Premium',
            'Fresh',
            'Daily',
            'Classic',
            'Original',
            'Family',
            'Smart',
            'Natural',
            'Golden',
            'Pure',
            'Great Value',
            'Best Choice',
            'Special',
            'Select',
            'Royal',
            'Deluxe',
            'Prime',
            'Ultra',
            'Super',
            'Value',
        ];

        $types = [
            'Choice',
            'Product',
            'Item',
            'Pack',
            'Essentials',
            'Select',
            'Classic',
            'Premium',
            'Value',
            'Special',
            'Goods',
            'Supplies',
        ];

        /*
        |--------------------------------------------------------------------------
        | Units
        |--------------------------------------------------------------------------
        */

        $units = [
            'pcs',
            'pack',
            'box',
            'bottle',
            'can',
            'bag',
            'kg',
            'g',
            'liter',
            'ml',
        ];

        /*
        |--------------------------------------------------------------------------
        | Descriptions
        |--------------------------------------------------------------------------
        */

        $descriptions = [
            'Quality product for everyday use.',
            'Popular product for retail customers.',
            'Suitable for general store inventory.',
            'Regular stock item.',
            'Fast-moving retail product.',
            'Commonly purchased item.',
            'General merchandise product.',
            'Quality item for daily consumption.',
            'Retail product for everyday needs.',
            'Standard inventory product.',
            null,
        ];

        /*
        |--------------------------------------------------------------------------
        | Get Existing Categories
        |--------------------------------------------------------------------------
        |
        | Do NOT assume category IDs are 1-50 or 1-100.
        | We get the real IDs directly from the database.
        |
        */

        $categoryIds = DB::table('categories')
            ->pluck('id')
            ->toArray();

        if (empty($categoryIds)) {
            $this->command?->error(
                'No categories found. Please seed categories first.'
            );

            return;
        }

        $this->command?->info(
            'Found ' . count($categoryIds) . ' categories.'
        );

        /*
        |--------------------------------------------------------------------------
        | Generate Products
        |--------------------------------------------------------------------------
        */

        $products = [];

        for ($i = 1; $i <= $totalProducts; $i++) {

            /*
            |--------------------------------------------------------------------------
            | Random Category
            |--------------------------------------------------------------------------
            */

            $categoryId = $categoryIds[array_rand($categoryIds)];

            /*
            |--------------------------------------------------------------------------
            | Product Name
            |--------------------------------------------------------------------------
            */

            $prefix = $prefixes[array_rand($prefixes)];

            $type = $types[array_rand($types)];

            $number = str_pad(
                (string) $i,
                4,
                '0',
                STR_PAD_LEFT
            );

            $name = "{$prefix} {$type} {$number}";

            /*
            |--------------------------------------------------------------------------
            | SKU
            |--------------------------------------------------------------------------
            */

            $sku = 'SKU-' . str_pad(
                (string) $i,
                6,
                '0',
                STR_PAD_LEFT
            );

            /*
            |--------------------------------------------------------------------------
            | Barcode
            |--------------------------------------------------------------------------
            |
            | Test barcode only.
            |
            */

            $barcode = '480' . str_pad(
                (string) $i,
                10,
                '0',
                STR_PAD_LEFT
            );

            /*
            |--------------------------------------------------------------------------
            | Selling Price
            |--------------------------------------------------------------------------
            |
            | Since the actual products table does NOT have cost_price,
            | we only generate selling_price.
            |
            */

            $sellingPrice = random_int(500, 150000) / 100;

            /*
            |--------------------------------------------------------------------------
            | Minimum Stock
            |--------------------------------------------------------------------------
            */

            $minimumStock = random_int(5, 30);

            /*
            |--------------------------------------------------------------------------
            | Active Status
            |--------------------------------------------------------------------------
            |
            | 95% Active
            | 5% Inactive
            |
            */

            $isActive = random_int(1, 100) <= 95;

            /*
            |--------------------------------------------------------------------------
            | Build Product
            |--------------------------------------------------------------------------
            */

            $products[] = [
                'category_id' => $categoryId,

                'name' => $name,

                'sku' => $sku,

                'barcode' => $barcode,

                'description' => $descriptions[array_rand($descriptions)],

                'unit' => $units[array_rand($units)],

                'selling_price' => $sellingPrice,

                'minimum_stock' => $minimumStock,

                'is_active' => $isActive,

                'created_at' => now(),

                'updated_at' => now(),
            ];

            /*
            |--------------------------------------------------------------------------
            | Insert Batch
            |--------------------------------------------------------------------------
            */

            if (count($products) >= $batchSize) {

                DB::table('products')->insert($products);

                $products = [];

                $this->command?->info(
                    "Inserted {$i} / {$totalProducts} products..."
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Insert Remaining Products
        |--------------------------------------------------------------------------
        */

        if (!empty($products)) {
            DB::table('products')->insert($products);
        }

        /*
        |--------------------------------------------------------------------------
        | Complete
        |--------------------------------------------------------------------------
        */

        $this->command?->info(
            "Successfully seeded {$totalProducts} products."
        );
    }
}
