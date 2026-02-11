@php
    $user = auth()->user();
    // Assuming user belongs to a store or we use a fallback
    $storeId = $user?->store?->id ?? $user?->store_id ?? 'default_store'; 
    $ownerName = $user?->name ?? 'Guest';
@endphp

<script src="https://chat.billiardscms.io.vn/static/script/embedding.js" data-id-store="{{ $storeId }}"></script>

