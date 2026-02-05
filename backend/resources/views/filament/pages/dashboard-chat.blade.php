@php
    $user = auth()->user();
    // Assuming user belongs to a store or we use a fallback
    $storeId = $user?->store?->id ?? $user?->store_id ?? 'default_store'; 
    $ownerName = $user?->name ?? 'Guest';
@endphp

<script>
    window.difyChatbotConfig = {
        token: 'djztYsdKqgVsLCo0',
        baseUrl: 'https://chat.billiardscms.io.vn',
        inputs: {
            "id_store": "{{ $storeId }}",
            "owner_name": "{{ $ownerName }}"
        },
        systemVariables: {
            // user_id: '{{ $user->id ?? "" }}',
            // conversation_id: '',
        },
        userVariables: {
            // avatar_url: '',
            // name: '{{ $ownerName }}',
        },
    }
</script>
<script src="https://chat.billiardscms.io.vn/embed.min.js" id="djztYsdKqgVsLCo0" defer>
</script>
<style>
    #dify-chatbot-bubble-button {
        background-color: #F8D000 !important;
    }

    #dify-chatbot-bubble-window {
        width: 24rem !important;
        height: 35rem !important;
        position: fixed !important;
        bottom: 1rem !important;
        right: 1rem !important;
        z-index: 50 !important;
    }
</style>
