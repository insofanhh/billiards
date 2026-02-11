@php
    $user = auth()->user();
    // Assuming user belongs to a store or we use a fallback
    $storeId = $user?->store?->id ?? $user?->store_id ?? 'default_store'; 
    $ownerName = $user?->name ?? 'Guest';
@endphp

<script src="https://chat.billiardscms.io.vn/static/script/embedding.js" data-id-store="{{ $storeId }}"></script>

<style>
    :root {
        --font-family: 'Quicksand', sans-serif !important;
    }
    .chat-fab-pulse {
        border: 2px solid #FFB400 !important;
        top: 0 !important;
        right: 0 !important;
        left: 0 !important;
        bottom: 0 !important;
    }
    .chat-fab{
        background-color: #FFB400 !important;
    }
    .message.user .message__bubble{
        background-color: #FFB400 !important;
    }
    .message.user .message__avatar{
        background-color: #FFB400 !important;
    }
    #chat-send{
        background-color: #FFB400 !important;
    }
    #chat-send svg{
        margin-right: 5px !important;
    }
    @media (max-width: 480px) {
        .chat-window {
            bottom: 0 !important;
            right: 0 !important;
        }
    }
</style>