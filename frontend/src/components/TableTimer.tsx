import { useEffect, useState } from 'react';

interface TableTimerProps {
    startTime: string | undefined;
}

export const TableTimer = ({ startTime }: TableTimerProps) => {
    const [duration, setDuration] = useState('00:00:00');

    useEffect(() => {
        if (!startTime) return;

        const calculate = () => {
            let dateStr = startTime;
            // Fix for SQL format without timezone (assume +07:00 / Asia/Ho_Chi_Minh)
            if (dateStr && typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('T')) {
                 dateStr = dateStr.replace(' ', 'T') + '+07:00';
            }
            const start = new Date(dateStr).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, now - start);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        // Initial calculation
        setDuration(calculate());

        // Update every second
        const interval = setInterval(() => {
            setDuration(calculate());
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <span>{duration}</span>
    );
};
