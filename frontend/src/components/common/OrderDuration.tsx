import { useState, useEffect } from 'react';

interface Props {
    startAt: string | null;
    isActive: boolean;
}

export function OrderDuration({ startAt, isActive }: Props) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (!isActive) return;
        
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => clearInterval(timer);
    }, [isActive]);

    if (!startAt) return <span>-</span>;

    let dateStr = startAt || '';
    // Fix for SQL format without timezone (assume +07:00 / Asia/Ho_Chi_Minh)
    if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('T')) {
         dateStr = dateStr.replace(' ', 'T') + '+07:00';
    }
    const start = new Date(dateStr).getTime();
    const now = currentTime.getTime();
    const diff = Math.max(0, now - start);
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return (
        <span className="font-semibold text-green-600 animate-pulse">
            {`${hours}h ${minutes}p ${seconds}s`}
        </span>
    );
}
