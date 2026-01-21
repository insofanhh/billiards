import { useEffect, useState } from 'react';

interface TableTimerProps {
    startTime: string | undefined;
}

export const TableTimer = ({ startTime }: TableTimerProps) => {
    const [duration, setDuration] = useState('00:00:00');

    useEffect(() => {
        if (!startTime) return;

        const calculate = () => {
            const start = new Date(startTime).getTime();
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
