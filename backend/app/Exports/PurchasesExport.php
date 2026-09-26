<?php

namespace App\Exports;

use Generator;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromGenerator;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class PurchasesExport implements FromGenerator, WithHeadings, WithEvents
{
    protected int $batchSize = 500;

    public function __construct(
        protected Builder $purchaseQuery,
        protected ?string $period = null,
        protected ?string $dateFrom = null,
        protected ?string $dateTo = null,
        protected ?string $search = null,
        protected ?string $supplier = null,
    ) {}

    public function headings(): array
    {
        return [
            'Purchase #',
            'Purchase Date',
            'Supplier',
            'Reference',
            'Status',
            'Subtotal',
            'Discount',
            'Tax',
            'Total',
            'Notes',
        ];
    }

    public function generator(): Generator
    {
        $purchases = $this->purchaseQuery
            ->clone()
            ->with('supplier')
            ->lazy($this->batchSize);

        foreach ($purchases as $purchase) {
            yield [
                $purchase->purchase_number,
                $purchase->purchase_date,
                $purchase->supplier?->name ?? '—',
                $purchase->reference_number ?? '—',
                $purchase->status,
                (float) $purchase->subtotal,
                (float) $purchase->discount,
                (float) $purchase->tax,
                (float) $purchase->total,
                $purchase->notes ?? '—',
            ];
        }
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                /*
                 * Add report header area.
                 */
                $sheet->insertNewRowBefore(1, 6);

                $highestRow = $sheet->getHighestRow();
                $dataStartRow = 8;

                /*
                 * Report title
                 */
                $sheet->mergeCells('A1:J1');

                $sheet->setCellValue(
                    'A1',
                    'PURCHASES REPORT'
                );

                $sheet->getStyle('A1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 18,
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_LEFT,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(28);

                /*
                 * Generated date
                 */
                $sheet->mergeCells('A2:J2');

                $sheet->setCellValue(
                    'A2',
                    'Generated: ' . now()->format('F d, Y h:i A')
                );

                $sheet->getStyle('A2')->applyFromArray([
                    'font' => [
                        'italic' => true,
                        'size' => 10,
                    ],
                ]);

                /*
                 * Filters
                 */
                $sheet->setCellValue('A3', 'Search');
                $sheet->setCellValue(
                    'B3',
                    $this->search ?: 'All'
                );

                $sheet->setCellValue('D3', 'Supplier');
                $sheet->setCellValue(
                    'E3',
                    $this->supplier ?: 'All Suppliers'
                );

                $sheet->setCellValue('A4', 'Period');
                $sheet->setCellValue(
                    'B4',
                    $this->formatPeriod($this->period)
                );

                $sheet->setCellValue('D4', 'Date From');
                $sheet->setCellValue(
                    'E4',
                    $this->dateFrom ?: '—'
                );

                $sheet->setCellValue('G4', 'Date To');
                $sheet->setCellValue(
                    'H4',
                    $this->dateTo ?: '—'
                );

                $sheet->getStyle('A3:H4')->applyFromArray([
                    'font' => [
                        'size' => 10,
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getStyle('A3:A4')->getFont()->setBold(true);
                $sheet->getStyle('D3:D4')->getFont()->setBold(true);
                $sheet->getStyle('G4')->getFont()->setBold(true);

                /*
                 * Table header
                 */
                $sheet->getStyle('A7:J7')->applyFromArray([
                    'font' => [
                        'bold' => true,
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => [
                            'rgb' => 'D9EAF7',
                        ],
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => 'B7B7B7',
                            ],
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(7)->setRowHeight(22);

                /*
                 * Data formatting
                 */
                if ($highestRow >= $dataStartRow) {
                    $sheet->getStyle(
                        "A{$dataStartRow}:J{$highestRow}"
                    )->applyFromArray([
                        'borders' => [
                            'bottom' => [
                                'borderStyle' => Border::BORDER_HAIR,
                                'color' => [
                                    'rgb' => 'D9D9D9',
                                ],
                            ],
                        ],
                        'alignment' => [
                            'vertical' => Alignment::VERTICAL_CENTER,
                        ],
                    ]);

                    /*
                     * Purchase number as text
                     */
                    for (
                        $row = $dataStartRow;
                        $row <= $highestRow;
                        $row++
                    ) {
                        $sheet->getCell("A{$row}")
                            ->setDataType(DataType::TYPE_STRING);
                    }

                    /*
                     * Number formats
                     */
                    $sheet->getStyle(
                        "F{$dataStartRow}:I{$highestRow}"
                    )->getNumberFormat()
                        ->setFormatCode('#,##0.00');

                    /*
                     * Date format
                     */
                    $sheet->getStyle(
                        "B{$dataStartRow}:B{$highestRow}"
                    )->getNumberFormat()
                        ->setFormatCode('yyyy-mm-dd');

                    /*
                     * Alternate rows
                     */
                    for (
                        $row = $dataStartRow;
                        $row <= $highestRow;
                        $row++
                    ) {
                        if ($row % 2 === 0) {
                            $sheet->getStyle(
                                "A{$row}:J{$row}"
                            )->applyFromArray([
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'color' => [
                                        'rgb' => 'F8F9FA',
                                    ],
                                ],
                            ]);
                        }
                    }

                    /*
                     * Status styling
                     */
                    for (
                        $row = $dataStartRow;
                        $row <= $highestRow;
                        $row++
                    ) {
                        $status = strtolower(
                            (string) $sheet
                                ->getCell("E{$row}")
                                ->getValue()
                        );

                        if (
                            $status === 'received' ||
                            $status === 'cancelled'
                        ) {
                            $sheet->getStyle("E{$row}")
                                ->getFont()
                                ->setBold(true);
                        }
                    }
                }

                /*
                 * Column widths
                 */
                $widths = [
                    'A' => 20,
                    'B' => 15,
                    'C' => 25,
                    'D' => 20,
                    'E' => 15,
                    'F' => 14,
                    'G' => 14,
                    'H' => 14,
                    'I' => 14,
                    'J' => 35,
                ];

                foreach ($widths as $column => $width) {
                    $sheet->getColumnDimension($column)
                        ->setWidth($width);
                }

                /*
                 * Table controls
                 */
                if ($highestRow >= 7) {
                    $sheet->setAutoFilter(
                        "A7:J{$highestRow}"
                    );
                }

                $sheet->freezePane('A8');

                /*
                 * Sheet settings
                 */
                $sheet->setShowGridlines(false);

                $sheet->getTabColor()
                    ->setRGB('4472C4');

                $sheet->getPageSetup()
                    ->setOrientation('landscape')
                    ->setFitToWidth(1)
                    ->setFitToHeight(0);

                $sheet->getPageMargins()
                    ->setTop(0.4)
                    ->setBottom(0.4)
                    ->setLeft(0.3)
                    ->setRight(0.3);

                $sheet->setSelectedCell('A1');
            },
        ];
    }

    protected function formatPeriod(?string $period): string
    {
        return match ($period) {
            'today' => 'Today',
            'yesterday' => 'Yesterday',
            'this_week' => 'This Week',
            'this_month' => 'This Month',
            'this_year' => 'This Year',
            'custom' => 'Custom',
            'all', null => 'All',
            default => ucwords(
                str_replace('_', ' ', $period)
            ),
        };
    }
}
