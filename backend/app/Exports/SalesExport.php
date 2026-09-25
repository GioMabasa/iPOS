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
            'C' => 16,
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
            'R' => 3,
            'S' => 3,
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
                 * Worksheet presentation.
                 */
                $sheet->getTabColor('4F46E5');

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
                        'bold' => true,
                        'color' => [
                            'rgb' => '475569',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'F8FAFC',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
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
                        'bold' => true,
                        'color' => [
                            'rgb' => '475569',
                        ],
                    ],
                    'fill' => [
                        'fillType' => 'solid',
                        'color' => [
                            'rgb' => 'F8FAFC',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
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
                    array $cards,
                    string $headingColor,
                    string $headingTextColor = 'FFFFFF'
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
                            'size' => 11,
                            'color' => [
                                'rgb' => $headingTextColor,
                            ],
                        ],
                        'fill' => [
                            'fillType' => 'solid',
                            'color' => [
                                'rgb' => $headingColor,
                            ],
                        ],
                        'alignment' => [
                            'horizontal' => 'left',
                            'vertical' => 'center',
                        ],
                    ]);

                    $sheet->getRowDimension($headingRow)->setRowHeight(21);

                    foreach ($cards as $card) {

                        $label = $card['label'];
                        $value = $card['value'];
                        $start = $card['start'];
                        $end = $card['end'];
                        $format =
                            $card['format']
                            ?? '#,##0.00';

                        $labelColor =
                            $card['labelColor']
                            ?? 'EEF2FF';

                        $valueColor =
                            $card['valueColor']
                            ?? 'F8FAFC';

                        $valueTextColor =
                            $card['valueTextColor']
                            ?? '0F172A';

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
                                    'color' => [
                                        'rgb' => 'CBD5E1',
                                    ],
                                ],
                            ],
                        ]);

                        $sheet->getStyle(
                            "{$start}{$labelRow}"
                        )->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'size' => 10,
                                'color' => [
                                    'rgb' => '475569',
                                ],
                            ],
                            'fill' => [
                                'fillType' => 'solid',
                                'color' => [
                                    'rgb' => $labelColor,
                                ],
                            ],
                        ]);

                        $sheet->getStyle(
                            "{$start}{$valueRow}"
                        )->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'size' => 13,
                                'color' => [
                                    'rgb' => $valueTextColor,
                                ],
                            ],
                            'fill' => [
                                'fillType' => 'solid',
                                'color' => [
                                    'rgb' => $valueColor,
                                ],
                            ],
                        ]);

                        $sheet->getStyle(
                            "{$start}{$valueRow}"
                        )->getNumberFormat()
                            ->setFormatCode($format);
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
                            'labelColor' => 'E0E7FF',
                            'valueColor' => 'EEF2FF',
                            'valueTextColor' => '3730A3',
                        ],
                        [
                            'label' => 'Total COGS',
                            'value' => $totalCogs,
                            'start' => 'F',
                            'end' => 'I',
                            'format' => '#,##0.00',
                            'labelColor' => 'DBEAFE',
                            'valueColor' => 'EFF6FF',
                            'valueTextColor' => '1D4ED8',
                        ],
                        [
                            'label' => 'Gross Profit',
                            'value' => $grossProfit,
                            'start' => 'K',
                            'end' => 'N',
                            'format' => '#,##0.00',
                            'labelColor' => 'DCFCE7',
                            'valueColor' => 'F0FDF4',
                            'valueTextColor' => '15803D',
                        ],
                        [
                            'label' => 'Gross Margin',
                            'value' => $grossMargin,
                            'start' => 'P',
                            'end' => 'S',
                            'format' => '0.00"%"',
                            'labelColor' => 'EDE9FE',
                            'valueColor' => 'F5F3FF',
                            'valueTextColor' => '6D28D9',
                        ],
                    ],
                    '4F46E5'
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
                            'labelColor' => 'DCFCE7',
                            'valueColor' => 'F0FDF4',
                            'valueTextColor' => '15803D',
                        ],
                        [
                            'label' => 'Charge Sales',
                            'value' => $chargeSales,
                            'start' => 'F',
                            'end' => 'I',
                            'format' => '#,##0.00',
                            'labelColor' => 'FEF3C7',
                            'valueColor' => 'FFFBEB',
                            'valueTextColor' => 'B45309',
                        ],
                        [
                            'label' => 'Outstanding Balance',
                            'value' => $outstandingBalance,
                            'start' => 'K',
                            'end' => 'N',
                            'format' => '#,##0.00',
                            'labelColor' => 'FEE2E2',
                            'valueColor' => 'FEF2F2',
                            'valueTextColor' => 'B91C1C',
                        ],
                    ],
                    '0EA5E9'
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
                            'labelColor' => 'E0E7FF',
                            'valueColor' => 'EEF2FF',
                            'valueTextColor' => '3730A3',
                        ],
                        [
                            'label' => 'Total Items Sold',
                            'value' => $totalItemsSold,
                            'start' => 'F',
                            'end' => 'I',
                            'format' => '#,##0',
                            'labelColor' => 'DBEAFE',
                            'valueColor' => 'EFF6FF',
                            'valueTextColor' => '1D4ED8',
                        ],
                        [
                            'label' => 'Total Void',
                            'value' => $totalVoid,
                            'start' => 'K',
                            'end' => 'N',
                            'format' => '#,##0',
                            'labelColor' => 'FEE2E2',
                            'valueColor' => 'FEF2F2',
                            'valueTextColor' => 'B91C1C',
                        ],
                        [
                            'label' => 'Total Refund',
                            'value' => $totalRefund,
                            'start' => 'P',
                            'end' => 'S',
                            'format' => '#,##0',
                            'labelColor' => 'FEF3C7',
                            'valueColor' => 'FFFBEB',
                            'valueTextColor' => 'B45309',
                        ],
                    ],
                    '8B5CF6'
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
                            'labelColor' => 'FCE7F3',
                            'valueColor' => 'FDF2F8',
                            'valueTextColor' => 'BE185D',
                        ],
                        [
                            'label' => 'Total Tax',
                            'value' => $totalTax,
                            'start' => 'K',
                            'end' => 'S',
                            'format' => '#,##0.00',
                            'labelColor' => 'CCFBF1',
                            'valueColor' => 'F0FDFA',
                            'valueTextColor' => '0F766E',
                        ],
                    ],
                    '14B8A6'
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
                    "A{$headerRow}:Q{$headerRow}"
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
                            'rgb' => '4338CA',
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => 'center',
                        'vertical' => 'center',
                        'wrapText' => true,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => 'thin',
                            'color' => [
                                'rgb' => 'CBD5E1',
                            ],
                        ],
                    ],
                ]);

                $sheet->getRowDimension($headerRow)->setRowHeight(30);

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
                     * Date.
                     */
                    if (!empty($row[2])) {

                        $sheet->setCellValue(
                            "C{$excelRow}",
                            \Carbon\Carbon::parse(
                                $row[2]
                            )->format('d/m/Y')
                        );
                    }

                    /*
                     * Due date.
                     */
                    if (!empty($row[15])) {

                        $sheet->setCellValue(
                            "P{$excelRow}",
                            \Carbon\Carbon::parse(
                                $row[15]
                            )->format('d/m/Y')
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
                     * Term.
                     */
                    $sheet->getStyle(
                        "O{$excelRow}"
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
                                    'rgb' => '15803D',
                                ],
                            ],
                            'fill' => [
                                'fillType' => 'solid',
                                'color' => [
                                    'rgb' => 'DCFCE7',
                                ],
                            ],
                            'alignment' => [
                                'horizontal' => 'center',
                            ],
                        ]);
                    } elseif ($status === 'voided') {

                        $sheet->getStyle(
                            "Q{$excelRow}"
                        )->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'color' => [
                                    'rgb' => 'B91C1C',
                                ],
                            ],
                            'fill' => [
                                'fillType' => 'solid',
                                'color' => [
                                    'rgb' => 'FEE2E2',
                                ],
                            ],
                            'alignment' => [
                                'horizontal' => 'center',
                            ],
                        ]);
                    } elseif ($status === 'refunded') {

                        $sheet->getStyle(
                            "Q{$excelRow}"
                        )->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'color' => [
                                    'rgb' => 'B45309',
                                ],
                            ],
                            'fill' => [
                                'fillType' => 'solid',
                                'color' => [
                                    'rgb' => 'FEF3C7',
                                ],
                            ],
                            'alignment' => [
                                'horizontal' => 'center',
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
                        "A{$headerRow}:Q{$lastDataRow}"
                    )->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => 'thin',
                                'color' => [
                                    'rgb' => 'E2E8F0',
                                ],
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
                            . ":Q"
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

                    $sheet->getStyle(
                        "N"
                            . ($headerRow + 1)
                            . ":Q"
                            . $lastDataRow
                    )->getAlignment()
                        ->setHorizontal('center');
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
