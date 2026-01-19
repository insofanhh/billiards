<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use App\Traits\BelongsToTenant;

class PriceRate extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'store_id',
        'table_type_id',
        'price_per_hour',
        'active',
        'day_of_week',
        'start_time',
        'end_time',
        'priority',
    ];

    protected $casts = [
        'price_per_hour' => 'decimal:2',
        'active' => 'boolean',
        'day_of_week' => 'array',
        'priority' => 'integer',
    ];

    public function tableType(): BelongsTo
    {
        return $this->belongsTo(TableType::class, 'table_type_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'price_rate_id');
    }

    public function scopeValidAtTime($query, $datetime = null)
    {
        $datetime = $datetime ? Carbon::parse($datetime) : Carbon::now();
        $dayOfWeek = $datetime->dayOfWeek;
        $time = $datetime->format('H:i:s');
        $prevDayOfWeek = ($dayOfWeek - 1 + 7) % 7;

        return $query->where(function ($q) use ($dayOfWeek, $prevDayOfWeek, $time) {
            $q->where(function ($dayQ) use ($dayOfWeek, $prevDayOfWeek, $time) {
                $dayQ->whereNull('day_of_week')
                    ->orWhere(function ($withDayQ) use ($dayOfWeek, $prevDayOfWeek, $time) {
                        $withDayQ->where(function ($currentDayQ) use ($dayOfWeek, $time) {
                            $currentDayQ->whereJsonContains('day_of_week', (string)$dayOfWeek)
                                ->where(function ($timeCheckQ) use ($time) {
                                    $timeCheckQ->whereNull('start_time')
                                        ->whereNull('end_time')
                                        ->orWhere(function ($withTimeQ) use ($time) {
                                            $dbDriver = config('database.default');
                                            if ($dbDriver === 'sqlite') {
                                                $withTimeQ->whereRaw('(TIME(start_time) <= TIME(end_time) AND TIME(?) BETWEEN TIME(start_time) AND TIME(end_time)) OR (TIME(start_time) > TIME(end_time) AND TIME(?) >= TIME(start_time))', [$time, $time]);
                                            } else {
                                                $withTimeQ->whereRaw('(CAST(start_time AS TIME) <= CAST(end_time AS TIME) AND ? BETWEEN CAST(start_time AS TIME) AND CAST(end_time AS TIME)) OR (CAST(start_time AS TIME) > CAST(end_time AS TIME) AND ? >= CAST(start_time AS TIME))', [$time, $time]);
                                            }
                                        });
                                });
                        })
                        ->orWhere(function ($prevDayQ) use ($prevDayOfWeek, $time) {
                            $prevDayQ->whereJsonContains('day_of_week', (string)$prevDayOfWeek)
                                ->whereNotNull('start_time')
                                ->whereNotNull('end_time')
                                ->where(function ($overnightQ) use ($time) {
                                    $dbDriver = config('database.default');
                                    if ($dbDriver === 'sqlite') {
                                        $overnightQ->whereRaw('TIME(start_time) > TIME(end_time) AND TIME(?) <= TIME(end_time)', [$time]);
                                    } else {
                                        $overnightQ->whereRaw('CAST(start_time AS TIME) > CAST(end_time AS TIME) AND ? <= CAST(end_time AS TIME)', [$time]);
                                    }
                                });
                        });
                    });
            })
            ->where(function ($timeQ) use ($time) {
                $timeQ->where(function ($noTimeQ) {
                    $noTimeQ->whereNull('start_time')
                        ->whereNull('end_time');
                })
                ->orWhere(function ($withTimeQ) use ($time) {
                    $dbDriver = config('database.default');
                    if ($dbDriver === 'sqlite') {
                        $withTimeQ->whereRaw('TIME(?) BETWEEN TIME(start_time) AND TIME(end_time)', [$time])
                            ->orWhere(function ($overnightQ) use ($time) {
                                $overnightQ->whereRaw('TIME(start_time) > TIME(end_time)')
                                    ->where(function ($orQ) use ($time) {
                                        $orQ->whereRaw('TIME(?) >= TIME(start_time)', [$time])
                                            ->orWhereRaw('TIME(?) <= TIME(end_time)', [$time]);
                                    });
                            });
                    } else {
                        $withTimeQ->whereRaw('? BETWEEN CAST(start_time AS TIME) AND CAST(end_time AS TIME)', [$time])
                            ->orWhere(function ($overnightQ) use ($time) {
                                $overnightQ->whereRaw('CAST(start_time AS TIME) > CAST(end_time AS TIME)')
                                    ->where(function ($orQ) use ($time) {
                                        $orQ->whereRaw('? >= CAST(start_time AS TIME)', [$time])
                                            ->orWhereRaw('? <= CAST(end_time AS TIME)', [$time]);
                                    });
                            });
                    }
                });
            });
        });
    }

    public function scopeForTableType($query, $tableTypeId)
    {
        return $query->where('table_type_id', $tableTypeId);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public static function forTableTypeAtTime($tableTypeId, $datetime = null)
    {
        $datetime = $datetime ? Carbon::parse($datetime) : Carbon::now();

        $priceRate = static::forTableType($tableTypeId)
            ->active()
            ->validAtTime($datetime)
            ->orderBy('priority', 'desc')
            ->orderBy('id', 'asc')
            ->first();

        if (!$priceRate) {
            $priceRate = static::forTableType($tableTypeId)
                ->active()
                ->whereNull('start_time')
                ->whereNull('end_time')
                ->whereNull('day_of_week')
                ->orderBy('priority', 'desc')
                ->orderBy('id', 'asc')
                ->first();
        }

        if (!$priceRate) {
            $priceRate = static::forTableType($tableTypeId)
                ->active()
                ->orderBy('priority', 'desc')
                ->orderBy('id', 'asc')
                ->first();
        }

        return $priceRate;
    }

    public function isValidAt($datetime = null): bool
    {
        $datetime = $datetime ? Carbon::parse($datetime) : Carbon::now();
        $dayOfWeek = $datetime->dayOfWeek;
        $time = $datetime->format('H:i:s');

        if ($this->day_of_week !== null && !in_array($dayOfWeek, $this->day_of_week)) {
            return false;
        }

        if ($this->start_time === null && $this->end_time === null) {
            return true;
        }

        if ($this->start_time !== null && $this->end_time !== null) {
            $startTime = is_string($this->start_time) ? Carbon::parse($this->start_time)->format('H:i:s') : $this->start_time;
            $endTime = is_string($this->end_time) ? Carbon::parse($this->end_time)->format('H:i:s') : $this->end_time;

            if (is_object($startTime)) {
                $startTime = $startTime->format('H:i:s');
            }
            if (is_object($endTime)) {
                $endTime = $endTime->format('H:i:s');
            }

            if ($startTime <= $endTime) {
                return $time >= $startTime && $time <= $endTime;
            } else {
                return $time >= $startTime || $time <= $endTime;
            }
        }

        return true;
    }
}
