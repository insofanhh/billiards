import { useState, useRef, useCallback, useEffect } from 'react';

export interface SerialState {
    isConnected: boolean;
    receivedData: string;
    error: string | null;
}

export const useWebSerial = () => {
    const [state, setState] = useState<SerialState>({
        isConnected: false,
        receivedData: '',
        error: null,
    });

    const portRef = useRef<any>(null);
    const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
    const writerRef = useRef<WritableStreamDefaultWriter | null>(null);
    const keepReading = useRef(false);

    const connect = useCallback(async () => {
        if (!('serial' in navigator)) {
            setState(s => ({ ...s, error: 'Web Serial API not supported in this browser.' }));
            return;
        }

        try {
            // Request a port and open a connection.
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 115200 }); // Standard ESP32 baud rate

            portRef.current = port;
            keepReading.current = true;
            
            setState(s => ({ ...s, isConnected: true, error: null }));
            
            // Start reading loop
            readLoop(port);

        } catch (err: any) {
            console.error('Serial Connection Error:', err);
            setState(s => ({ ...s, error: err.message || 'Failed to connect.' }));
        }
    }, []);

    const disconnect = useCallback(async () => {
        keepReading.current = false;
        
        if (readerRef.current) {
            await readerRef.current.cancel();
            readerRef.current = null;
        }

        if (writerRef.current) {
            writerRef.current.releaseLock();
            writerRef.current = null;
        }

        if (portRef.current) {
            await portRef.current.close();
            portRef.current = null;
        }

        setState(s => ({ ...s, isConnected: false }));
    }, []);

    const readLoop = async (port: any) => {
        while (port.readable && keepReading.current) {
            const textDecoder = new TextDecoderStream();
            port.readable.pipeTo(textDecoder.writable);
            const reader = textDecoder.readable.getReader();
            readerRef.current = reader;

            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value) {
                         setState(s => ({ ...s, receivedData: s.receivedData + value }));
                         console.log('Serial Read:', value); // Debug log
                    }
                }
            } catch (error) {
                console.error('Read Error:', error);
            } finally {
                reader.releaseLock();
            }
        }
    };

    const sendCommand = useCallback(async (data: string) => {
        if (!portRef.current?.writable) return;

        const textEncoder = new TextEncoderStream();
        textEncoder.readable.pipeTo(portRef.current.writable);
        const writer = textEncoder.writable.getWriter();
        writerRef.current = writer;

        await writer.write(data);
        writer.releaseLock();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (state.isConnected) {
                disconnect();
            }
        };
    }, []);

    return {
        ...state,
        connect,
        disconnect,
        sendCommand,
        clearData: () => setState(s => ({ ...s, receivedData: '' }))
    };
};
