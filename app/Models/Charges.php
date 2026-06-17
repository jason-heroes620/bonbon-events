<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class Charges extends Model
{
    use HasUuids;

    protected $table = 'charges';
    protected $primaryKey = 'charges_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'charges_name',
        'charges_type',
        'charges_rate',
        'charges_description',
        'charges_start_date',
        'charges_end_date',
        'charges_status',
        'sort_order',
    ];

    protected $casts = [
        'charges_rate' => 'float',
        'charges_status' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function getRouteKeyName(): string
    {
        return 'charges_id';
    }

    public static function activeForDate(?Carbon $date = null): Collection
    {
        $dateValue = ($date ?? now())->toDateString();

        return self::query()
            ->where('charges_status', true)
            ->where('charges_start_date', '<=', $dateValue)
            ->where(function ($query) use ($dateValue) {
                $query->whereNull('charges_end_date')
                    ->orWhere('charges_end_date', '>=', $dateValue);
            })
            ->orderBy('sort_order')
            ->orderBy('charges_name')
            ->get();
    }
    public static function calculateForBase(float $baseAmount, Collection $charges): array
    {
        $base = max(0.0, $baseAmount);
        $lines = [];
        $lines = [];
        $total = 0.0;

        foreach ($charges as $charge) {
            $type = (string) ($charge->charges_type ?? '');
            $rate = (float) ($charge->charges_rate ?? 0);

            $amount = 0.0;
            if ($type === 'P') {
                $amount = round($base * ($rate / 100.0), 2);
            } elseif ($type === 'F') {
                $amount = round($rate, 2);
            }

            if ($amount <= 0) {
                continue;
            }

            $lines[] = [
                'charges_id' => $charge->charges_id ? (string) $charge->charges_id : null,
                'charges_name' => (string) ($charge->charges_name ?? 'Charge'),
                'charges_type' => $type,
                'charges_rate' => $rate,
                'charges_amount' => $amount,
                'sort_order' => (int) ($charge->sort_order ?? 1),
            ];

            $total += $amount;
        }

        return [
            'lines' => $lines,
            'total' => round($total, 2),
        ];
    }
}
