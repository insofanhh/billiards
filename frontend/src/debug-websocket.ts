// Debug WebSocket connection
export const debugWebSocket = () => {
  console.log('=== WebSocket Debug Info ===');
  console.log('VITE_REVERB_APP_KEY:', import.meta.env.VITE_REVERB_APP_KEY);
  console.log('VITE_REVERB_HOST:', import.meta.env.VITE_REVERB_HOST);
  console.log('VITE_REVERB_PORT:', import.meta.env.VITE_REVERB_PORT);
  console.log('VITE_REVERB_SCHEME:', import.meta.env.VITE_REVERB_SCHEME);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  
  // Test WebSocket connection
  const wsUrl = `${import.meta.env.VITE_REVERB_SCHEME === 'https' ? 'wss' : 'ws'}://${import.meta.env.VITE_REVERB_HOST}:${import.meta.env.VITE_REVERB_PORT}/app/${import.meta.env.VITE_REVERB_APP_KEY}?protocol=7&client=js&version=8.4.0&flash=false`;
  console.log('WebSocket URL:', wsUrl);
  
  try {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ WebSocket connected successfully');
      ws.close();
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket connection error:', error);
    };
    
    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
    };
  } catch (error) {
    console.error('❌ WebSocket creation error:', error);
  }
};
