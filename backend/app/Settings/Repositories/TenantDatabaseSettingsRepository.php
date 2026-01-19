<?php

namespace App\Settings\Repositories;

use Illuminate\Database\Eloquent\Builder;
use Spatie\LaravelSettings\SettingsRepositories\DatabaseSettingsRepository;

class TenantDatabaseSettingsRepository extends DatabaseSettingsRepository
{
    public function getPropertiesInGroup(string $group): array
    {
        // 1. Get from DB (scoped by store via getBuilder)
        $dbProperties = parent::getPropertiesInGroup($group);

        // 2. If valid Store context, and group is 'general', merge defaults
        // This simulates that the store has these settings (preventing MissingSettings exception on saving)
        if (app()->has('currentStoreId') && $group === 'general') {
            $defaults = \App\Settings\GeneralSettings::defaults();
            return array_merge($defaults, $dbProperties);
        }

        return $dbProperties;
    }

    public function getBuilder(): Builder
    {
        $builder = parent::getBuilder();

        if (app()->has('currentStoreId')) {
            $builder->where('store_id', app('currentStoreId'));
            \Illuminate\Support\Facades\Log::info('TenantDatabaseSettingsRepository: Filtering for store', ['store_id' => app('currentStoreId')]);
        } else {
            // STRICT ISOLATION:
            // If we are not in a tenant context, we should ONLY return global settings (store_id IS NULL).
            // This prevents "falling through" to return ANY row in the table, which causes the leakage.
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

        if (app()->has('currentStoreId')) {
            $data['store_id'] = app('currentStoreId');
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

            if (app()->has('currentStoreId')) {
                $search['store_id'] = app('currentStoreId');
            } else {
                $search['store_id'] = null;
            }

            $this->getBuilder()->updateOrInsert($search, [
                'payload' => $this->encode($payload),
            ]);
        }
    }
}
