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
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ExpensesExport implements
    FromCollection,
    WithHeadings,
    WithStyles,
    WithEvents,
    WithColumnWidths
{
    protected Collection $data;

    protected ?string $period;
    protected ?string $dateFrom;
    protected ?string $dateTo;
    protected ?string $search;
    protected ?string $category;
    protected ?string $paymentMethod;
    protected ?string $status;

    public function __construct(
        Collection $data,
        ?string $period = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        ?string $search = null,
        ?string $category = null,
        ?string $paymentMethod = null,
        ?string $status = null
    ) {
        $this->data = $data;
        $this->period = $period;
        $this->dateFrom = $dateFrom;
        $this->dateTo = $dateTo;
        $this->search = $search;
        $this->category = $category;
        $this->paymentMethod = $paymentMethod;
        $this->status = $status;
    }

    public function collection(): Collection
    {
        return $this->data->map(function ($expense) {
            return [
                $expense['expense_date'] ?? '',
                $expense['category'] ?? '',
                $expense['description'] ?? '',
                $expense['payment_method'] ?? '',
                $expense['reference_no'] ?? '',
                $expense['amount'] ?? 0,
                $expense['status'] ?? '',
                $expense['notes'] ?? '',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Date',
            'Category',
            'Description',
            'Payment Method',
            'Reference No.',
            'Amount',
            'Status',
            'Notes',
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
            'A' => 16,
            'B' => 24,
            'C' => 34,
            'D' => 20,
            'E' => 22,
            'F' => 18,
            'G' => 16,
            'H' => 36,
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {

                $sheet = $event->sheet->getDelegate();

                /*
                 * Summary calculations.
                 */

                $totalExpenses = $this->data
                    ->filter(function ($expense) {
                        return strtolower(
                            (string) ($expense['status'] ?? '')
                        ) === 'recorded';
                    })
                    ->sum(function ($expense) {
                        return (float) ($expense['amount'] ?? 0);
                    });

                $recordedExpenses = $this->data
                    ->filter(function ($expense) {
                        return strtolower(
                            (string) ($expense['status'] ?? '')
                        ) === 'recorded';
                    })
                    ->count();

                $voidedExpenses = $this->data
                    ->filter(function ($expense) {
                        return strtolower(
                            (string) ($expense['status'] ?? '')
                        ) === 'voided';
                    })
                    ->sum(function ($expense) {
                        return (float) ($expense['amount'] ?? 0);
                    });

                $expenseTransactions = $this->data->count();

                /*
                 * Summary occupies rows 1 - 13.
                 */

                $summaryRows = 13;

                $sheet->insertNewRowBefore(1, $summaryRows);

                /*
                 * Worksheet presentation.
                 */

                $sheet->getTabColor('4F46E5');

                /*
                 * Main title.
                 */

                $sheet->mergeCells('A1:H1');

                $sheet->setCellValue(
                    'A1',
                    'EXPENSE SUMMARY'
                );

                $sheet->getStyle('A1:H1')->applyFromArray([
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
                 * Filter context.
                 */

                $periodText = 'All Dates';

                if ($this->period) {
                    $periodText = match ($this->period) {
                        'today' => 'Today',
                        'yesterday' => 'Yesterday',
                        'this_week' => 'This Week',
                        'this_month' => 'This Month',
                        'last_month' => 'Last Month',
                        'this_year' => 'This Year',
                        'custom' => 'Custom',
                        default => $this->period,
                    };
                }

                $dateFromText = $this->dateFrom ?: 'All';
                $dateToText = $this->dateTo ?: 'All';
                $searchText = $this->search ?: 'All';
                $categoryText = $this->category ?: 'All Categories';
                $paymentText = $this->paymentMethod ?: 'All Payment Methods';
                $statusText = $this->status ?: 'All Statuses';

                $filters = [
                    'A2' => 'Period: ' . $periodText,
                    'A3' => 'Date From: ' . $dateFromText,
                    'A4' => 'Date To: ' . $dateToText,
                    'A5' => 'Search: ' . $searchText,
                    'A6' => 'Category: ' . $categoryText,
                    'A7' => 'Payment Method: ' . $paymentText,
                    'A8' => 'Status: ' . $statusText,
                ];

                foreach ($filters as $cell => $value) {

                    $row = (int) preg_replace('/[^0-9]/', '', $cell);

                    $sheet->mergeCells(
                        "A{$row}:H{$row}"
                    );

                    $sheet->setCellValue(
                        $cell,
                        $value
                    );

                    $sheet->getStyle(
                        "A{$row}:H{$row}"
                    )->applyFromArray([
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

                    $sheet->getRowDimension($row)
                        ->setRowHeight(20);
                }

                /*
                 * Summary group.
                 */

                $sheet->mergeCells('A10:H10');

                $sheet->setCellValue(
                    'A10',
                    'EXPENSE OVERVIEW'
                );

                $sheet->getStyle('A10:H10')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
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
                        'horizontal' => 'left',
                        'vertical' => 'center',
                    ],
                ]);

                $sheet->getRowDimension(10)->setRowHeight(21);

                /*
                 * Summary cards.
                 */

                $cards = [
                    [
                        'range' => 'A11:B12',
                        'label' => 'Total Expenses',
                        'value' => $totalExpenses,
                        'format' => '#,##0.00',
                        'labelColor' => 'E0E7FF',
                        'valueColor' => 'EEF2FF',
                        'valueTextColor' => '3730A3',
                    ],
                    [
                        'range' => 'C11:D12',
                        'label' => 'Recorded Expenses',
                        'value' => $recordedExpenses,
                        'format' => '#,##0',
                        'labelColor' => 'DCFCE7',
                        'valueColor' => 'F0FDF4',
                        'valueTextColor' => '15803D',
                    ],
                    [
                        'range' => 'E11:F12',
                        'label' => 'Voided Expenses',
                        'value' => $voidedExpenses,
                        'format' => '#,##0.00',
                        'labelColor' => 'FEE2E2',
                        'valueColor' => 'FEF2F2',
                        'valueTextColor' => 'B91C1C',
                    ],
                    [
                        'range' => 'G11:H12',
                        'label' => 'Expense Transactions',
                        'value' => $expenseTransactions,
                        'format' => '#,##0',
                        'labelColor' => 'EDE9FE',
                        'valueColor' => 'F5F3FF',
                        'valueTextColor' => '6D28D9',
                    ],
                ];

                foreach ($cards as $card) {

                    $range = $card['range'];

                    [$startCell] = explode(':', $range);

                    $startColumn = preg_replace('/[0-9]/', '', $startCell);
                    $startRow = (int) preg_replace('/[^0-9]/', '', $startCell);

                    $endCell = explode(':', $range)[1];
                    $endColumn = preg_replace('/[0-9]/', '', $endCell);

                    $labelRow = $startRow;
                    $valueRow = $startRow + 1;

                    $sheet->mergeCells(
                        "{$startColumn}{$labelRow}:{$endColumn}{$labelRow}"
                    );

                    $sheet->mergeCells(
                        "{$startColumn}{$valueRow}:{$endColumn}{$valueRow}"
                    );

                    $sheet->setCellValue(
                        "{$startColumn}{$labelRow}",
                        $card['label']
                    );

                    $sheet->setCellValue(
                        "{$startColumn}{$valueRow}",
                        $card['value']
                    );

                    $sheet->getStyle(
                        $range
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
                        "{$startColumn}{$labelRow}"
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
                                'rgb' => $card['labelColor'],
                            ],
                        ],
                    ]);

                    $sheet->getStyle(
                        "{$startColumn}{$valueRow}"
                    )->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'size' => 13,
                            'color' => [
                                'rgb' => $card['valueTextColor'],
                            ],
                        ],
                        'fill' => [
                            'fillType' => 'solid',
                            'color' => [
                                'rgb' => $card['valueColor'],
                            ],
                        ],
                    ]);

                    $sheet->getStyle(
                        "{$startColumn}{$valueRow}"
                    )->getNumberFormat()
                        ->setFormatCode($card['format']);
                }

                $sheet->getRowDimension(11)->setRowHeight(25);
                $sheet->getRowDimension(12)->setRowHeight(25);

                /*
                 * Detailed section.
                 */

                $sheet->mergeCells('A14:H14');

                $sheet->setCellValue(
                    'A14',
                    'EXPENSE DETAILS'
                );

                $sheet->getStyle('A14:H14')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 11,
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
                        'horizontal' => 'left',
                        'vertical' => 'center',
                    ],
                ]);

                $sheet->getRowDimension(14)->setRowHeight(24);

                /*
                 * Detailed table header.
                 */

                $headerRow = 15;

                $headings = $this->headings();

                foreach ($headings as $index => $heading) {

                    $column = Coordinate::stringFromColumnIndex(
                        $index + 1
                    );

                    $sheet->setCellValue(
                        "{$column}{$headerRow}",
                        $heading
                    );
                }

                $sheet->getStyle(
                    "A{$headerRow}:H{$headerRow}"
                )->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => [
                            'rgb' => 'FFFFFF',
                        ],
                        'size' => 10,
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

                $sheet->getRowDimension($headerRow)
                    ->setRowHeight(30);

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

                        $column = Coordinate::stringFromColumnIndex(
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

                    if (!empty($row[0])) {

                        $sheet->setCellValue(
                            "A{$excelRow}",
                            \Carbon\Carbon::parse(
                                $row[0]
                            )->format('d/m/Y')
                        );
                    }

                    /*
                     * Amount.
                     */

                    $sheet->getStyle(
                        "F{$excelRow}"
                    )->getNumberFormat()
                        ->setFormatCode('#,##0.00');

                    /*
                     * Status formatting.
                     */

                    $status = strtolower(
                        (string) ($row[6] ?? '')
                    );

                    if ($status === 'recorded') {

                        $sheet->getStyle(
                            "G{$excelRow}"
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
                            "G{$excelRow}"
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
                        "A{$headerRow}:H{$lastDataRow}"
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
                        "A"
                            . ($headerRow + 1)
                            . ":E"
                            . $lastDataRow
                    )->getAlignment()
                        ->setHorizontal('left');

                    $sheet->getStyle(
                        "F"
                            . ($headerRow + 1)
                            . ":F"
                            . $lastDataRow
                    )->getAlignment()
                        ->setHorizontal('right');

                    $sheet->getStyle(
                        "G"
                            . ($headerRow + 1)
                            . ":G"
                            . $lastDataRow
                    )->getAlignment()
                        ->setHorizontal('center');

                    $sheet->getStyle(
                        "H"
                            . ($headerRow + 1)
                            . ":H"
                            . $lastDataRow
                    )->getAlignment()
                        ->setHorizontal('left');
                }

                /*
                 * Row heights.
                 */

                for (
                    $row = $headerRow + 1;
                    $row <= $lastDataRow;
                    $row++
                ) {
                    $sheet->getRowDimension($row)
                        ->setRowHeight(22);
                }

                /*
                 * Freeze table header.
                 */

                $sheet->freezePane(
                    'A16'
                );

                /*
                 * Auto filter.
                 */

                if ($lastDataRow >= $headerRow) {

                    $sheet->setAutoFilter(
                        "A{$headerRow}:H{$lastDataRow}"
                    );
                }

                /*
                 * Worksheet view.
                 */

                $sheet->setShowGridlines(false);

                /*
                 * Print settings.
                 */

                $sheet->getPageSetup()
                    ->setOrientation(
                        \PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE
                    );

                $sheet->getPageSetup()
                    ->setFitToWidth(1);

                $sheet->getPageSetup()
                    ->setFitToHeight(0);
            },
        ];
    }
}
