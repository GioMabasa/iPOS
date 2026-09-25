<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class ReportsExport implements
    FromCollection,
    WithHeadings,
    WithStyles,
    WithEvents,
    WithColumnWidths
{
    protected Collection $data;

    protected ?string $dateFrom;

    protected ?string $dateTo;

    public function __construct(
        Collection $data,
        ?string $dateFrom = null,
        ?string $dateTo = null
    ) {
        $this->data = $data;
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
    }

    public function collection(): Collection
    {
        return $this->data->map(function ($sale) {
            return [
                $sale['sale_date']
                    ? \Carbon\Carbon::parse($sale['sale_date'])->format('d/m/Y')
                    : '',
                $sale['sale_number'] ?? '',
                $sale['invoice_number'] ?? '',
                $sale['cashier'] ?? '—',
                $sale['status'] ?? '',
                $sale['total'] ?? 0,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Date',
            'Sale Number',
            'Invoice Number',
            'Cashier',
            'Status',
            'Total',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => [
                    'bold' => true,
                ],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 20,
            'B' => 20,
            'C' => 20,
            'D' => 24,
            'E' => 16,
            'F' => 18,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {

                $sheet = $event->sheet->getDelegate();

                /*
                |--------------------------------------------------------------------------
                | Summary
                |--------------------------------------------------------------------------
                */

                $completedSales = $this->data->filter(function ($sale) {
                    return strtolower(
                        (string) ($sale['status'] ?? '')
                    ) === 'completed';
                });

                $totalTransactions = $this->data->count();

                $totalSales = $completedSales->sum(function ($sale) {
                    return (float) ($sale['total'] ?? 0);
                });

                $totalCogs = $completedSales->sum(function ($sale) {
                    return (float) ($sale['cogs'] ?? 0);
                });

                $grossProfit = $completedSales->sum(function ($sale) {
                    return (float) ($sale['gross_profit'] ?? 0);
                });

                if ($grossProfit === 0.0 && $totalSales > 0) {
                    $grossProfit = $totalSales - $totalCogs;
                }

                $grossMargin = $totalSales > 0
                    ? ($grossProfit / $totalSales) * 100
                    : 0;

                /*
                |--------------------------------------------------------------------------
                | Report Period
                |--------------------------------------------------------------------------
                */

                $periodText = 'All Dates';

                if ($this->dateFrom && $this->dateTo) {
                    $periodText =
                        $this->dateFrom
                        . ' to '
                        . $this->dateTo;
                } elseif ($this->dateFrom) {
                    $periodText =
                        'From '
                        . $this->dateFrom;
                } elseif ($this->dateTo) {
                    $periodText =
                        'Until '
                        . $this->dateTo;
                }

                /*
                |--------------------------------------------------------------------------
                | Summary Rows
                |--------------------------------------------------------------------------
                */

                $summaryRows = 12;

                $sheet->insertNewRowBefore(1, $summaryRows);

                /*
                |--------------------------------------------------------------------------
                | SALES SUMMARY HEADER
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A1:F1');

                $sheet->setCellValue(
                    'A1',
                    'SALES SUMMARY'
                );

                $sheet->getStyle('A1:F1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => '4F46E5',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(30);

                /*
                |--------------------------------------------------------------------------
                | REPORT PERIOD
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A2:F2');

                $sheet->setCellValue(
                    'A2',
                    'Report Period: ' . $periodText
                );

                $sheet->getStyle('A2:F2')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => [
                            'rgb' => '4338CA',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'EEF2FF',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                    ],
                ]);

                $sheet->getRowDimension(2)->setRowHeight(22);

                /*
                |--------------------------------------------------------------------------
                | SUMMARY CARDS
                |--------------------------------------------------------------------------
                */

                $createCard = function (
                    string $labelStart,
                    string $labelEnd,
                    string $valueStart,
                    string $valueEnd,
                    string $label,
                    float|int $value,
                    string $format,
                    string $color,
                    string $lightColor
                ) use ($sheet) {

                    $sheet->mergeCells(
                        "{$labelStart}4:{$labelEnd}4"
                    );

                    $sheet->setCellValue(
                        "{$labelStart}4",
                        $label
                    );

                    $sheet->mergeCells(
                        "{$valueStart}5:{$valueEnd}5"
                    );

                    $sheet->setCellValue(
                        "{$valueStart}5",
                        $value
                    );

                    $sheet->getStyle(
                        "{$labelStart}4:{$labelEnd}5"
                    )->applyFromArray([
                        'alignment' => [
                            'horizontal' => 'center',
                            'vertical' => 'center',
                        ],
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => 'thin',
                                'color' => [
                                    'rgb' => 'D1D5DB',
                                ],
                            ],
                        ],
                    ]);

                    $sheet->getStyle(
                        "{$labelStart}4"
                    )->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'color' => [
                                'rgb' => $color,
                            ],
                        ],
                        'fill' => [
                            'fillType' => 'solid',
                            'color' => [
                                'rgb' => $lightColor,
                            ],
                        ],
                    ]);

                    $sheet->getStyle(
                        "{$valueStart}5"
                    )->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 12,
                            'color' => [
                                'rgb' => $color,
                            ],
                        ],
                        'fill' => [
                            'fillType' => 'solid',
                            'color' => [
                                'rgb' => 'FFFFFF',
                            ],
                        ],
                    ]);

                    $sheet->getStyle(
                        "{$valueStart}5"
                    )
                        ->getNumberFormat()
                        ->setFormatCode($format);
                };

                /*
                |--------------------------------------------------------------------------
                | Total Sales
                |--------------------------------------------------------------------------
                */

                $createCard(
                    'A',
                    'C',
                    'A',
                    'C',
                    'Total Sales',
                    $totalSales,
                    '#,##0.00',
                    '2563EB',
                    'DBEAFE'
                );

                /*
                |--------------------------------------------------------------------------
                | Total COGS
                |--------------------------------------------------------------------------
                */

                $createCard(
                    'D',
                    'F',
                    'D',
                    'F',
                    'Total COGS',
                    $totalCogs,
                    '#,##0.00',
                    'EA580C',
                    'FFEDD5'
                );

                /*
                |--------------------------------------------------------------------------
                | Gross Profit
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A6:C6');

                $sheet->setCellValue(
                    'A6',
                    'Gross Profit'
                );

                $sheet->mergeCells('A7:C7');

                $sheet->setCellValue(
                    'A7',
                    $grossProfit
                );

                $sheet->getStyle('A6:C6')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => [
                            'rgb' => '16A34A',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'DCFCE7',
                        ],
                    ],
                ]);

                $sheet->getStyle('A7:C7')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                        'color' => [
                            'rgb' => '16A34A',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                    ],
                ]);

                /*
                |--------------------------------------------------------------------------
                | Gross Margin
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('D6:F6');

                $sheet->setCellValue(
                    'D6',
                    'Gross Margin'
                );

                $sheet->mergeCells('D7:F7');

                $sheet->setCellValue(
                    'D7',
                    $grossMargin
                );

                $sheet->getStyle('D6:F6')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => [
                            'rgb' => '7C3AED',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'EDE9FE',
                        ],
                    ],
                ]);

                $sheet->getStyle('D7:F7')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                        'color' => [
                            'rgb' => '7C3AED',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                    ],
                ]);

                /*
                |--------------------------------------------------------------------------
                | Summary Borders
                |--------------------------------------------------------------------------
                */

                $sheet->getStyle('A4:F7')->applyFromArray([
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                            'color' => [
                                'rgb' => 'D1D5DB',
                            ],
                        ],
                    ],
                ]);

                $sheet->getStyle('A7')
                    ->getNumberFormat()
                    ->setFormatCode('#,##0.00');

                $sheet->getStyle('D7')
                    ->getNumberFormat()
                    ->setFormatCode('0.00"%"');

                /*
                |--------------------------------------------------------------------------
                | Total Transactions
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A9:F9');

                $sheet->setCellValue(
                    'A9',
                    'TOTAL TRANSACTIONS'
                );

                $sheet->getStyle('A9:F9')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => [
                            'rgb' => '0F766E',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'CCFBF1',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                            'color' => [
                                'rgb' => 'D1D5DB',
                            ],
                        ],
                    ],
                ]);

                $sheet->mergeCells('A10:F10');

                $sheet->setCellValue(
                    'A10',
                    $totalTransactions
                );

                $sheet->getStyle('A10:F10')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 13,
                        'color' => [
                            'rgb' => '0F766E',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                            'color' => [
                                'rgb' => 'D1D5DB',
                            ],
                        ],
                    ],
                ]);

                $sheet->getStyle('A10')
                    ->getNumberFormat()
                    ->setFormatCode('#,##0');

                /*
                |--------------------------------------------------------------------------
                | Table Header
                |--------------------------------------------------------------------------
                */

                $headerRow = 13;

                $headings = $this->headings();

                foreach ($headings as $index => $heading) {

                    $column =
                        Coordinate::stringFromColumnIndex(
                            $index + 1
                        );

                    $sheet->setCellValue(
                        "{$column}{$headerRow}",
                        $heading
                    );
                }

                $sheet->getStyle(
                    "A{$headerRow}:F{$headerRow}"
                )->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => '2563EB',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                            'color' => [
                                'rgb' => 'BFDBFE',
                            ],
                        ],
                    ],
                ]);

                $sheet->getRowDimension($headerRow)->setRowHeight(24);

                /*
                |--------------------------------------------------------------------------
                | Table Data
                |--------------------------------------------------------------------------
                */

                $dataRows = $this->collection();

                foreach ($dataRows as $rowIndex => $row) {

                    $excelRow =
                        $headerRow
                        + 1
                        + $rowIndex;

                    foreach ($row as $columnIndex => $value) {

                        $column =
                            Coordinate::stringFromColumnIndex(
                                $columnIndex + 1
                            );

                        $sheet->setCellValue(
                            "{$column}{$excelRow}",
                            $value
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Total
                    |--------------------------------------------------------------------------
                    */

                    $sheet->getStyle(
                        "F{$excelRow}"
                    )
                        ->getNumberFormat()
                        ->setFormatCode('#,##0.00');

                    /*
                    |--------------------------------------------------------------------------
                    | Status
                    |--------------------------------------------------------------------------
                    */

                    $status =
                        strtolower(
                            (string) ($row[4] ?? '')
                        );

                    if ($status === 'completed') {

                        $sheet->getStyle(
                            "E{$excelRow}"
                        )->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'color' => [
                                    'rgb' => '008000',
                                ],
                            ],
                        ]);
                    } elseif ($status === 'voided') {

                        $sheet->getStyle(
                            "E{$excelRow}"
                        )->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'color' => [
                                    'rgb' => 'C00000',
                                ],
                            ],
                        ]);
                    } elseif ($status === 'refunded') {

                        $sheet->getStyle(
                            "E{$excelRow}"
                        )->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'color' => [
                                    'rgb' => 'BF6000',
                                ],
                            ],
                        ]);
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Table Borders
                |--------------------------------------------------------------------------
                */

                $lastDataRow =
                    $headerRow + $dataRows->count();

                if ($lastDataRow >= $headerRow) {

                    $sheet->getStyle(
                        "A{$headerRow}:F{$lastDataRow}"
                    )->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => 'thin',
                                'color' => [
                                    'rgb' => 'D1D5DB',
                                ],
                            ],
                        ],
                    ]);
                }

                /*
                |--------------------------------------------------------------------------
                | Alignment
                |--------------------------------------------------------------------------
                */

                if ($lastDataRow >= $headerRow + 1) {

                    $sheet->getStyle(
                        'A' . ($headerRow + 1) .
                            ':E' . $lastDataRow
                    )
                        ->getAlignment()
                        ->setHorizontal('left');

                    $sheet->getStyle(
                        'F' . ($headerRow + 1) .
                            ':F' . $lastDataRow
                    )
                        ->getAlignment()
                        ->setHorizontal('right');
                }

                /*
                |--------------------------------------------------------------------------
                | Freeze Header
                |--------------------------------------------------------------------------
                */

                $sheet->freezePane(
                    'A' . ($headerRow + 1)
                );
            },
        ];
    }
}
