<?php

namespace App\Providers\Filament;

use App\Filament\Pages\ManageGeneralSettings;
use BezhanSalleh\FilamentShield\FilamentShieldPlugin;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Widgets\AccountWidget;
use Filament\Widgets\FilamentInfoWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->colors([
                'primary' => Color::Amber,
            ])
            ->font('Quicksand')
            ->brandLogo(asset('/icons/logo_white.png'))
            ->brandLogoHeight('2.5rem')
            ->homeUrl(function () {
                $tenant = \Filament\Facades\Filament::getTenant();
                if ($tenant) {
                    // Direct navigation to store frontend
                    // TokenInitializer will automatically sync token from session
                    return '/s/' . $tenant->slug;
                }
                return '/';
            })
            ->favicon(asset('icons/logo.png'))
            ->profile(\Filament\Auth\Pages\EditProfile::class)
            ->navigationGroups([
                'Quản lý đơn hàng',
                'Quản lý dịch vụ',
                'Quản lý bàn',
                'Quản lý bài đăng',
                'Quản lý hệ thống',
                'Filament Shield'
            ])
            ->sidebarCollapsibleOnDesktop()
            ->breadcrumbs(false)
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\Filament\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\Filament\Pages')
            ->pages([
                \App\Filament\Pages\Dashboard::class,
                ManageGeneralSettings::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\Filament\Widgets')
            ->widgets([
                \App\Filament\Widgets\StatsOverview::class,
                \App\Filament\Widgets\OrdersChart::class,
                \App\Filament\Widgets\RevenueChart::class,
                
                \App\Filament\Widgets\ServicesSoldToday::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->plugin(FilamentShieldPlugin::make())
            ->renderHook(
                'panels::head.start',
                fn (): string => <<<'HTML'
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap" rel="stylesheet">
                    <!-- PWA Meta Tags -->
                    <meta name="theme-color" content="#000000ff">
                    <meta name="apple-mobile-web-app-capable" content="yes">
                    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
                    <meta name="apple-mobile-web-app-title" content="Verda CMS">
                    <link rel="manifest" href="/manifest.json">
                    <link rel="apple-touch-icon" href="/icons/logo.png">
                HTML
            )
            ->renderHook(
                'panels::body.end',
                fn (): string => <<<'HTML'
                    <!-- PWA Service Worker Registration -->
                    <script>
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', () => {
                                navigator.serviceWorker.register('/sw.js')
                                    .then(registration => {
                                        console.log('[PWA] Service Worker registered successfully:', registration.scope);
                                        
                                        // Check for updates
                                        registration.addEventListener('updatefound', () => {
                                            const newWorker = registration.installing;
                                            newWorker.addEventListener('statechange', () => {
                                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                                    console.log('[PWA] New content available, please refresh.');
                                                }
                                            });
                                        });
                                    })
                                    .catch(error => {
                                        console.error('[PWA] Service Worker registration failed:', error);
                                    });
                            });
                        }
                    </script>
                HTML
            )
            ->authMiddleware([
                Authenticate::class,
            ])
            ->tenant(\App\Models\Store::class, slugAttribute: 'slug')
            ->tenantMiddleware([
                \App\Http\Middleware\SyncFilamentTenant::class,
            ], isPersistent: true);
    }
}
