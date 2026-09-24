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

class SalesExport implements
    FromCollection,
    WithHeadings,
    WithStyles,
    WithEvents,
    WithColumnWidths
{
    protected Collection $data;

    protected ?string $dateFrom;

    protected ?string $dateTo;

    protected ?string $paymentMethod;

    public function __construct(
        Collection $data,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $paymentMethod = null
    ) {
        $this->data = $data;
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->paymentMethod = $paymentMethod;
    }

    public function collection(): Collection
    {
        return $this->data->map(function ($sale) {

            return [
                $sale['sale_number'] ?? '',
                $sale['invoice_number'] ?? '',
                $sale['sale_date'] ?? '',
                $sale['customer'] ?? 'Walk-in Customer',
                $sale['cashier'] ?? '—',
                $sale['total_items'] ?? 0,
                $sale['subtotal'] ?? 0,
                $sale['discount'] ?? 0,
                $sale['tax'] ?? 0,
                $sale['total'] ?? 0,
                $sale['cogs'] ?? 0,
                $sale['gross_profit'] ?? 0,
                $sale['gross_margin'] ?? 0,
                $sale['payment_method'] ?? '',
                $sale['term_months'] ?? 0,
                $sale['due_date'] ?? '',
                $sale['status'] ?? '',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Sale #',
            'Invoice #',
            'Date',
            'Customer',
            'Cashier',
            'Items',
            'Subtotal',
            'Discount',
            'Tax',
            'Total',
            'COGS',
            'Gross Profit',
            'Gross Margin',
            'Payment Method',
            'Term (Months)',
            'Due Date',
            'Status',
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
            'A' => 18,
            'B' => 18,
            'C' => 20,
            'D' => 24,
            'E' => 20,
            'F' => 10,
            'G' => 14,
            'H' => 14,
            'I' => 14,
            'J' => 14,
            'K' => 14,
            'L' => 16,
            'M' => 14,
            'N' => 16,
            'O' => 14,
            'P' => 16,
            'Q' => 14,

        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {

                $sheet = $event->sheet->getDelegate();

                /*
                 * Summary calculations
                 *
                 * The export data is already transformed
                 * into arrays by SaleController.
                 */

                $completedSales = $this->data->filter(function ($sale) {
                    return ($sale['status'] ?? '') === 'Completed';
                });

                $totalTransactions = $this->data->count();

                $totalItemsSold = $completedSales->sum(function ($sale) {
                    return (float) ($sale['total_items'] ?? 0);
                });

                $totalSales = $completedSales->sum(function ($sale) {
                    return (float) ($sale['total'] ?? 0);
                });

                $totalCogs = $completedSales->sum(function ($sale) {
                    return (float) ($sale['cogs'] ?? 0);
                });

                $grossProfit = $totalSales - $totalCogs;

                $grossMargin = $totalSales > 0
                    ? ($grossProfit / $totalSales) * 100
                    : 0;

                $cashSales = $completedSales
                    ->filter(function ($sale) {
                        return strtolower(
                            (string) ($sale['payment_method'] ?? '')
                        ) === 'cash';
                    })
                    ->sum(function ($sale) {
                        return (float) ($sale['total'] ?? 0);
                    });

                $chargeSales = $completedSales
                    ->filter(function ($sale) {
                        return strtolower(
                            (string) ($sale['payment_method'] ?? '')
                        ) === 'charge';
                    })
                    ->sum(function ($sale) {
                        return (float) ($sale['total'] ?? 0);
                    });


                $outstandingBalance = $completedSales
                    ->filter(function ($sale) {
                        return strtolower(
                            (string) ($sale['payment_method'] ?? '')
                        ) === 'charge';
                    })
                    ->sum(function ($sale) {

                        $total = (float) ($sale['total'] ?? 0);

                        $paid = (float) ($sale['amount_paid'] ?? 0);

                        return max(0, $total - $paid);
                    });

                $totalVoid = $this->data
                    ->filter(function ($sale) {
                        return strtolower(
                            (string) ($sale['status'] ?? '')
                        ) === 'voided';
                    })
                    ->count();

                $totalRefund = $this->data
                    ->filter(function ($sale) {
                        return strtolower(
                            (string) ($sale['status'] ?? '')
                        ) === 'refunded';
                    })
                    ->count();

                $totalDiscount = $completedSales->sum(function ($sale) {
                    return (float) ($sale['discount'] ?? 0);
                });

                $totalTax = $completedSales->sum(function ($sale) {
                    return (float) ($sale['tax'] ?? 0);
                });

                /*
                 * Summary occupies rows 1 - 19.
                 */
                $summaryRows = 19;

                $sheet->insertNewRowBefore(1, $summaryRows);

                /*
                 * Summary title.
                 */
                $sheet->mergeCells('A1:S1');

                $sheet->setCellValue(
                    'A1',
                    'SALES SUMMARY'
                );

                $sheet->getStyle('A1:S1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(28);

                /*
                 * Period.
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

                $sheet->mergeCells('A2:S2');

                $sheet->setCellValue(
                    'A2',
                    'Period: ' . $periodText
                );

                $sheet->getStyle('A2:S2')->applyFromArray([
                    'font' => [
                        'italic' => true,
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                    ],
                ]);

                /*
                 * Payment Method filter.
                 */
                $paymentText = 'All Payment Methods';

                if ($this->paymentMethod) {
                    $paymentText =
                        ucfirst($this->paymentMethod);
                }

                $sheet->mergeCells('A3:S3');

                $sheet->setCellValue(
                    'A3',
                    'Payment Method: ' . $paymentText
                );

                $sheet->getStyle('A3:S3')->applyFromArray([
                    'font' => [
                        'italic' => true,
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                    ],
                ]);

                /*
                 * Summary card group helper.
                 */
                $createGroup = function (
                    int $headingRow,
                    int $labelRow,
                    int $valueRow,
                    string $title,
                    array $cards
                ) use ($sheet) {

                    $sheet->mergeCells(
                        "A{$headingRow}:S{$headingRow}"
                    );

                    $sheet->setCellValue(
                        "A{$headingRow}",
                        $title
                    );

                    $sheet->getStyle(
                        "A{$headingRow}:S{$headingRow}"
                    )->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 12,
                        ],
                        'alignment' => [
                            'horizontal' => 'left',
                            'vertical' => 'center',
                        ],
                    ]);

                    foreach ($cards as $card) {

                        $label = $card['label'];
                        $value = $card['value'];
                        $start = $card['start'];
                        $end = $card['end'];
                        $format =
                            $card['format']
                            ?? '#,##0.00';

                        $sheet->mergeCells(
                            "{$start}{$labelRow}:{$end}{$labelRow}"
                        );

                        $sheet->setCellValue(
                            "{$start}{$labelRow}",
                            $label
                        );

                        $sheet->mergeCells(
                            "{$start}{$valueRow}:{$end}{$valueRow}"
                        );

                        $sheet->setCellValue(
                            "{$start}{$valueRow}",
                            $value
                        );

                        $sheet->getStyle(
                            "{$start}{$labelRow}:{$end}{$valueRow}"
                        )->applyFromArray([
                            'alignment' => [
                                'horizontal' => 'center',
                                'vertical' => 'center',
                            ],
                            'borders' => [
                                'allBorders' => [
                                    'borderStyle' => 'thin',
                                ],
                            ],
                        ]);

                        $sheet->getStyle(
                            "{$start}{$labelRow}"
                        )->applyFromArray([
                            'font' => [
                                'bold' => true,
                            ],
                            'fill' => [
                                'fillType' => 'solid',
                                'color' => [
                                    'rgb' => 'EFEFEF',
                                ],
                            ],
                        ]);

                        $sheet->getStyle(
                            "{$start}{$valueRow}"
                        )->getNumberFormat()
                            ->setFormatCode($format);

                        $sheet->getStyle(
                            "{$start}{$valueRow}"
                        )->getFont()->setBold(true);
                    }
                };

                /*
                 * SALES & PROFIT
                 */
                $createGroup(
                    5,
                    6,
                    7,
                    'SALES & PROFIT',
                    [
                        [
                            'label' => 'Total Sales',
                            'value' => $totalSales,
                            'start' => 'A',
                            'end' => 'D',
                            'format' => '#,##0.00',
                        ],
                        [
                            'label' => 'Total COGS',
                            'value' => $totalCogs,
                            'start' => 'F',
                            'end' => 'I',
                            'format' => '#,##0.00',
                        ],
                        [
                            'label' => 'Gross Profit',
                            'value' => $grossProfit,
                            'start' => 'K',
                            'end' => 'N',
                            'format' => '#,##0.00',
                        ],
                        [
                            'label' => 'Gross Margin',
                            'value' => $grossMargin,
                            'start' => 'P',
                            'end' => 'S',
                            'format' => '0.00"%"',
                        ],
                    ]
                );

                /*
                 * PAYMENT
                 */
                $createGroup(
                    9,
                    10,
                    11,
                    'PAYMENT',
                    [
                        [
                            'label' => 'Cash Sales',
                            'value' => $cashSales,
                            'start' => 'A',
                            'end' => 'D',
                            'format' => '#,##0.00',
                        ],
                        [
                            'label' => 'Charge Sales',
                            'value' => $chargeSales,
                            'start' => 'F',
                            'end' => 'I',
                            'format' => '#,##0.00',
                        ],
                        [
                            'label' => 'Outstanding Balance',
                            'value' => $outstandingBalance,
                            'start' => 'K',
                            'end' => 'N',
                            'format' => '#,##0.00',
                        ],
                    ]
                );

                /*
                 * TRANSACTIONS
                 */
                $createGroup(
                    13,
                    14,
                    15,
                    'TRANSACTIONS',
                    [
                        [
                            'label' => 'Total Transactions',
                            'value' => $totalTransactions,
                            'start' => 'A',
                            'end' => 'D',
                            'format' => '#,##0',
                        ],
                        [
                            'label' => 'Total Items Sold',
                            'value' => $totalItemsSold,
                            'start' => 'F',
                            'end' => 'I',
                            'format' => '#,##0',
                        ],
                        [
                            'label' => 'Total Void',
                            'value' => $totalVoid,
                            'start' => 'K',
                            'end' => 'N',
                            'format' => '#,##0',
                        ],
                        [
                            'label' => 'Total Refund',
                            'value' => $totalRefund,
                            'start' => 'P',
                            'end' => 'S',
                            'format' => '#,##0',
                        ],
                    ]
                );

                /*
                 * ADJUSTMENTS
                 */
                $createGroup(
                    17,
                    18,
                    19,
                    'ADJUSTMENTS',
                    [
                        [
                            'label' => 'Total Discount',
                            'value' => $totalDiscount,
                            'start' => 'A',
                            'end' => 'H',
                            'format' => '#,##0.00',
                        ],
                        [
                            'label' => 'Total Tax',
                            'value' => $totalTax,
                            'start' => 'K',
                            'end' => 'S',
                            'format' => '#,##0.00',
                        ],
                    ]
                );

                /*
                 * Detailed table header.
                 */
                $headerRow = 20;

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
                    "A{$headerRow}:R{$headerRow}"
                )->applyFromArray([
                    'font' => [
                        'bold' => true,
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'D9EAF7',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                        ],
                    ],
                ]);

                /*
                 * Detailed table data.
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
                     * Currency / amount columns.
                     */
                    foreach (
                        [
                            'G',
                            'H',
                            'I',
                            'J',
                            'K',
                            'L',
                        ] as $column
                    ) {

                        $sheet->getStyle(
                            "{$column}{$excelRow}"
                        )->getNumberFormat()
                            ->setFormatCode(
                                '#,##0.00'
                            );
                    }

                    /*
                     * Items.
                     */
                    $sheet->getStyle(
                        "F{$excelRow}"
                    )->getNumberFormat()
                        ->setFormatCode(
                            '#,##0'
                        );

                    /*
                     * Gross Margin.
                     */
                    $sheet->getStyle(
                        "M{$excelRow}"
                    )->getNumberFormat()
                        ->setFormatCode(
                            '0.00"%"'
                        );

                    /*
                     * Status formatting.
                     */
                    $status = strtolower(
                        (string) ($row[16] ?? '')
                    );

                    if ($status === 'completed') {

                        $sheet->getStyle(
                            "Q{$excelRow}"
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
                            "Q{$excelRow}"
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
                            "Q{$excelRow}"
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
                 * Table borders.
                 */
                $lastDataRow =
                    $headerRow
                    + $dataRows->count();

                if ($lastDataRow >= $headerRow) {

                    $sheet->getStyle(
                        "A{$headerRow}:S{$lastDataRow}"
                    )->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => 'thin',
                            ],
                        ],
                    ]);
                }

                /*
                 * Table alignment.
                 */
                if ($lastDataRow >= $headerRow + 1) {

                    $sheet->getStyle(
                        "F"
                            . ($headerRow + 1)
                            . ":S"
                            . $lastDataRow
                    )->getAlignment()
                        ->setHorizontal('right');

                    $sheet->getStyle(
                        "A"
                            . ($headerRow + 1)
                            . ":E"
                            . $lastDataRow
                    )->getAlignment()
                        ->setHorizontal('left');
                }

                /*
                 * Freeze detailed table header.
                 */
                $sheet->freezePane(
                    "A" . ($headerRow + 1)
                );
            },
        ];
    }
}
