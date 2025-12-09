<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (file_exists(public_path('index.html'))) {
        return response()->file(public_path('index.html'));
    }
    return view('welcome');
});

Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api|admin|broadcasting|livewire).*$');

Route::fallback(function () {
    $path = request()->path();
    
    if (str_starts_with($path, 'api') || 
        str_starts_with($path, 'broadcasting') ||
        str_starts_with($path, '_')) {
        abort(404);
    }
    
    if (file_exists(public_path('index.html'))) {
        return response()->file(public_path('index.html'));
    }
    
    abort(404);
});
