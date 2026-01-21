<?php

namespace App\Settings\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Spatie\LaravelSettings\SettingsRepositories\DatabaseSettingsRepository;
use Filament\Facades\Filament;

class TenantDatabaseSettingsRepository extends DatabaseSettingsRepository
{
    protected function getStoreId()
    {
        if (Filament::getTenant()) {
            return Filament::getTenant()->id;
        }

        if (app()->has('currentStoreId')) {
            return app('currentStoreId');
        }

        return null;
    }

    public function getPropertiesInGroup(string $group): array
    {
        // 1. Get from DB (scoped by store via getBuilder)
        $dbProperties = parent::getPropertiesInGroup($group);

        // 2. If valid Store context, and group is 'general', merge defaults
        if ($this->getStoreId() && $group === 'general') {
            $defaults = \App\Settings\GeneralSettings::defaults();
            return array_merge($defaults, $dbProperties);
        }

        return $dbProperties;
    }

    public function getBuilder(): Builder
    {
        $builder = parent::getBuilder();
        $storeId = $this->getStoreId();

        if ($storeId) {
            $builder->where('store_id', $storeId);
            \Illuminate\Support\Facades\Log::info('TenantDatabaseSettingsRepository: Filtering for store', ['store_id' => $storeId]);
        } else {
            // STRICT ISOLATION:
            // If we are not in a tenant context, we should ONLY return global settings (store_id IS NULL).
            $builder->whereNull('store_id');
            \Illuminate\Support\Facades\Log::info('TenantDatabaseSettingsRepository: Filtering for global settings (store_id = null)');
        }

        return $builder;
    }

    public function createProperty(string $group, string $name, $payload): void
    {
        $data = [
            'group' => $group,
            'name' => $name,
            'payload' => $this->encode($payload),
            'locked' => false,
        ];

        if ($storeId = $this->getStoreId()) {
            $data['store_id'] = $storeId;
        }

        $this->getBuilder()->create($data);
    }

    public function updatePropertiesPayload(string $group, array $properties): void
    {
        foreach ($properties as $name => $payload) {
            $search = [
                'group' => $group,
                'name' => $name,
            ];

            if ($storeId = $this->getStoreId()) {
                $search['store_id'] = $storeId;
            } else {
                $search['store_id'] = null;
            }

            $this->getBuilder()->updateOrInsert($search, [
                'payload' => $this->encode($payload),
            ]);
        }
    }
}
