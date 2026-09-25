<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Illuminate\Support\Enumerable;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class PurchasesExport implements
    FromCollection,
    WithHeadings,
    WithMapping,
    WithColumnFormatting,
    WithCustomStartCell,
    WithEvents,
    ShouldAutoSize
{
    public function __construct(
        protected Collection $data,
        protected ?string $period = null,
        protected ?string $dateFrom = null,
        protected ?string $dateTo = null,
        protected ?string $search = null,
        protected ?string $supplier = null,
    ) {}

    public function collection(): Enumerable
    {
        return $this->data;
    }

    public function startCell(): string
    {
        return 'A7';
    }

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

    public function map($purchase): array
    {
        return [
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

    public function columnFormats(): array
    {
        return [
            'B' => 'dd/mm/yyyy',
            'F' => '#,##0.00',
            'G' => '#,##0.00',
            'H' => '#,##0.00',
            'I' => '#,##0.00',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                /*
                |--------------------------------------------------------------------------
                | iPOS Colors
                |--------------------------------------------------------------------------
                */

                $primary = '4F46E5';
                $primaryDark = '3730A3';
                $primaryLight = 'EEF2FF';

                $slate50 = 'F8FAFC';
                $slate200 = 'E2E8F0';
                $slate600 = '475569';
                $slate900 = '0F172A';

                $white = 'FFFFFF';

                /*
                |--------------------------------------------------------------------------
                | Report Title
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A1:J1');

                $sheet->setCellValue(
                    'A1',
                    'PURCHASES REPORT'
                );

                $sheet->getStyle('A1:J1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 18,
                        'color' => [
                            'rgb' => $white,
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $primary,
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(1)->setRowHeight(34);

                /*
                |--------------------------------------------------------------------------
                | Generated Date
                |--------------------------------------------------------------------------
                */

                $sheet->mergeCells('A2:J2');

                $sheet->setCellValue(
                    'A2',
                    'Generated: ' .
                        now('Asia/Manila')->format('F d, Y h:i A')
                );

                $sheet->getStyle('A2:J2')->applyFromArray([
                    'font' => [
                        'size' => 10,
                        'color' => [
                            'rgb' => $slate600,
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $primaryLight,
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getRowDimension(2)->setRowHeight(22);

                /*
                |--------------------------------------------------------------------------
                | Filter Summary
                |--------------------------------------------------------------------------
                */

                $sheet->setCellValue(
                    'A3',
                    'SEARCH'
                );

                $sheet->setCellValue(
                    'B3',
                    $this->search ?: 'All'
                );

                $sheet->setCellValue(
                    'D3',
                    'DATE FROM'
                );

                $sheet->setCellValue(
                    'E3',
                    $this->formatDate($this->dateFrom)
                );

                $sheet->setCellValue(
                    'A4',
                    'SUPPLIER'
                );

                $sheet->setCellValue(
                    'B4',
                    $this->supplier ?: 'All Suppliers'
                );

                $sheet->setCellValue(
                    'D4',
                    'DATE TO'
                );

                $sheet->setCellValue(
                    'E4',
                    $this->formatDate($this->dateTo)
                );

                $sheet->setCellValue(
                    'A5',
                    'PERIOD'
                );

                $sheet->setCellValue(
                    'B5',
                    $this->formatPeriod()
                );

                /*
                |--------------------------------------------------------------------------
                | Filter Labels
                |--------------------------------------------------------------------------
                */

                $sheet->getStyle('A3:A5')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 9,
                        'color' => [
                            'rgb' => $primaryDark,
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $primaryLight,
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => $slate200,
                            ],
                        ],
                    ],
                ]);

                $sheet->getStyle('D3:D4')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 9,
                        'color' => [
                            'rgb' => $primaryDark,
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $primaryLight,
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => $slate200,
                            ],
                        ],
                    ],
                ]);

                /*
                |--------------------------------------------------------------------------
                | Filter Values
                |--------------------------------------------------------------------------
                */

                $sheet->getStyle('B3:B5')->applyFromArray([
                    'font' => [
                        'size' => 10,
                        'color' => [
                            'rgb' => $slate900,
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $white,
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => $slate200,
                            ],
                        ],
                    ],
                ]);

                $sheet->getStyle('E3:E4')->applyFromArray([
                    'font' => [
                        'size' => 10,
                        'color' => [
                            'rgb' => $slate900,
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $white,
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => $slate200,
                            ],
                        ],
                    ],
                ]);

                /*
                |--------------------------------------------------------------------------
                | Table Header
                |--------------------------------------------------------------------------
                */

                $sheet->getStyle('A7:J7')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 10,
                        'color' => [
                            'rgb' => $white,
                        ],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => [
                            'rgb' => $primaryDark,
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => [
                                'rgb' => $primary,
                            ],
                        ],
                    ],
                ]);

                $sheet->getRowDimension(7)->setRowHeight(28);

                /*
                |--------------------------------------------------------------------------
                | Data Rows
                |--------------------------------------------------------------------------
                */

                $lastRow = 7 + $this->data->count();

                if ($lastRow >= 8) {
                    $sheet->getStyle("A8:J{$lastRow}")
                        ->applyFromArray([
                            'font' => [
                                'size' => 10,
                                'color' => [
                                    'rgb' => $slate900,
                                ],
                            ],
                            'alignment' => [
                                'vertical' => Alignment::VERTICAL_CENTER,
                            ],
                            'borders' => [
                                'bottom' => [
                                    'borderStyle' => Border::BORDER_HAIR,
                                    'color' => [
                                        'rgb' => $slate200,
                                    ],
                                ],
                            ],
                        ]);

                    /*
                    |--------------------------------------------------------------------------
                    | Alternating Rows
                    |--------------------------------------------------------------------------
                    */

                    for ($row = 8; $row <= $lastRow; $row++) {
                        if ($row % 2 === 0) {
                            $sheet
                                ->getStyle("A{$row}:J{$row}")
                                ->getFill()
                                ->setFillType(Fill::FILL_SOLID);

                            $sheet
                                ->getStyle("A{$row}:J{$row}")
                                ->getFill()
                                ->getStartColor()
                                ->setRGB($slate50);
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Alignment
                    |--------------------------------------------------------------------------
                    */

                    $sheet
                        ->getStyle("A8:A{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_LEFT
                        );

                    $sheet
                        ->getStyle("B8:B{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_CENTER
                        );

                    $sheet
                        ->getStyle("E8:E{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_CENTER
                        );

                    $sheet
                        ->getStyle("F8:I{$lastRow}")
                        ->getAlignment()
                        ->setHorizontal(
                            Alignment::HORIZONTAL_RIGHT
                        );
                }

                /*
                |--------------------------------------------------------------------------
                | Column Widths
                |--------------------------------------------------------------------------
                */

                $sheet->getColumnDimension('A')->setWidth(18);
                $sheet->getColumnDimension('B')->setWidth(16);
                $sheet->getColumnDimension('C')->setWidth(25);
                $sheet->getColumnDimension('D')->setWidth(20);
                $sheet->getColumnDimension('E')->setWidth(14);
                $sheet->getColumnDimension('F')->setWidth(15);
                $sheet->getColumnDimension('G')->setWidth(15);
                $sheet->getColumnDimension('H')->setWidth(15);
                $sheet->getColumnDimension('I')->setWidth(15);
                $sheet->getColumnDimension('J')->setWidth(30);

                /*
                |--------------------------------------------------------------------------
                | Excel Filter
                |--------------------------------------------------------------------------
                */

                $sheet->setAutoFilter(
                    "A7:J{$lastRow}"
                );

                /*
                |--------------------------------------------------------------------------
                | Freeze Table Header
                |--------------------------------------------------------------------------
                */

                $sheet->freezePane('A8');

                $sheet->setSelectedCell('A1');
            },
        ];
    }

    private function formatDate(?string $date): string
    {
        if (!$date) {
            return '—';
        }

        return date(
            'd/m/Y',
            strtotime($date)
        );
    }

    private function formatPeriod(): string
    {
        return match ($this->period) {
            'today' => 'Today',
            'yesterday' => 'Yesterday',
            'this_week' => 'This Week',
            'this_month' => 'This Month',
            'this_year' => 'This Year',
            'custom' => 'Custom',
            'all', null, '' => 'All',
            default => $this->period,
        };
    }
}
