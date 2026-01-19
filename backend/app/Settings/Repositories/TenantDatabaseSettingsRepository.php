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
        $propertiesInBatch = collect($properties)->map(function ($payload, $name) use ($group) {
            $data = [
                'group' => $group,
                'name' => $name,
                'payload' => $this->encode($payload),
            ];

            if (app()->has('currentStoreId')) {
                $data['store_id'] = app('currentStoreId');
            }

            return $data;
        })->values()->toArray();

        // Must match the UNIQUE constraint for upsert
        $uniqueBy = ['group', 'name'];
        if (app()->has('currentStoreId')) {
             $uniqueBy[] = 'store_id';
        }

        // Note: upsert requires the exact columns to check for uniqueness. 
        // If store_id is nullable and we are in tenant context, we insert store_id.
        // If store_id is NOT in the uniqueBy array when it IS in the data, upsert might fail or duplicate if null vs value mismatch?
        // Actually, Postgres/MySQL handle unique constraint checks.
        // But the second argument to upsert is `uniqueBy`.
        
        $this->getBuilder()
            ->where('group', $group) // Does this where clause affect upsert? No, upsert is on the model/table.
            ->upsert($propertiesInBatch, $uniqueBy, ['payload']);
    }
}
