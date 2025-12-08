<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Transaction;
use App\Events\TransactionConfirmed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class SepayController extends Controller
{
    public function config()
    {
        return response()->json([
            'bank_account' => config('sepay.bank_account'),
            'bank_provider' => config('sepay.bank_provider'),
            'pattern' => config('sepay.pattern'),
        ]);
    }

}
