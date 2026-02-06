<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('users:cleanup-temporary')->dailyAt('00:00');

Schedule::command('report:daily-revenue')->dailyAt('23:59');

Schedule::command('stores:check-expired')->dailyAt('00:00');
