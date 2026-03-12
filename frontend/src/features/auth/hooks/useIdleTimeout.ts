import { useEffect, useRef, useCallback, useState } from 'react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;     // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000;    // Show warning 5 min before
const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export const useIdleTimeout = (onLogout: () => void, enabled: boolean) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [remaining, setRemaining] = useState(0);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimers = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        setShowWarning(false);
    }, []);

    const resetTimer = useCallback(() => {
        clearTimers();
        if (!enabled) return;

        // Warning timer: fires 5 min before logout
        warningTimerRef.current = setTimeout(() => {
            setShowWarning(true);
            setRemaining(WARNING_BEFORE_MS / 1000);
            countdownRef.current = setInterval(() => {
                setRemaining(prev => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

        // Logout timer: fires after full idle timeout
        timerRef.current = setTimeout(() => {
            clearTimers();
            onLogout();
        }, IDLE_TIMEOUT_MS);
    }, [enabled, onLogout, clearTimers]);

    const dismissWarning = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    useEffect(() => {
        if (!enabled) return;

        // Reset on any user activity
        const handleActivity = () => resetTimer();
        EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
        resetTimer();

        return () => {
            EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
            clearTimers();
        };
    }, [enabled, resetTimer, clearTimers]);

    return { showWarning, remaining, dismissWarning };
};
