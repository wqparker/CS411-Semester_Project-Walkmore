import { createContext, useContext, useState, useEffect, useRef } from 'react';

/**
 * LocationContext - usage explanation
 *
 * Provides a single source of truth for the user's current position.
 * Two modes:
 *   - Live mode:  browser Geolocation API (watchPosition) drives updates
 *   - Demo mode:  setMockPosition(lat, lon) overrides GPS for presentations
 *
 * Any screen that needs position calls useLocation():
 *   const { position, accuracy, demoMode, setMockPosition, clearMockPosition, error } = useLocation();
 *
 * position is always [lat, lon] or null while acquiring.
 */

const LocationContext = createContext(null);

// Default fallback while GPS acquires (Empire State Building)
const NYC_FALLBACK = [40.7484, -73.9857];

export function LocationProvider({ children }) {
    const [position, setPosition] = useState(null);     // [lat, lon] | null
    const [accuracy, setAccuracy] = useState(null);     // metres
    const [error, setError] = useState(null);           // string | null
    const [loading, setLoading] = useState(false);      // changing to false now for permission ask
    const [permissionState, setPermissionState] = useState('idle'); // 'idle'|'requesting'|'granted'|'denied'|'unavailable'
    const [demoMode, setDemoMode] = useState(false);
    const watchIdRef = useRef(null);

    const [devModeEnabled, setDevModeEnabledState] = useState(
        () => localStorage.getItem('devModeEnabled') === 'true'
    );

    // Real GPS 
    // Cleanup watch on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    // On mount, check if permission was already granted in a previous session
    useEffect(() => {
        if (!navigator.permissions) return; // not supported in all browsers
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
            if (result.status === 'granted') {
                requestLocation();
            }
            // 'prompt' = never asked, show our card
            // 'denied' = blocked, show our card with error messaging
        });
    }, []);

    // Called when user taps "Enable Location" in the pre-prompt card
    const requestLocation = () => {
        if (!navigator.geolocation) {
            setPermissionState('unavailable');
            setError('Geolocation is not supported by this browser.');
            return;
        }
        setPermissionState('requesting');
        setLoading(true);

        const onSuccess = (geo) => {
            setDemoMode(prev => {
                if (!prev) {
                    setPosition([geo.coords.latitude, geo.coords.longitude]);
                    setAccuracy(geo.coords.accuracy);
                    setError(null);
                    setLoading(false);
                    setPermissionState('granted');
                }
                return prev;
            });
        };

        const onError = (err) => {
            const messages = {
                1: 'Location permission denied. Enable it in browser settings or use Demo Mode.',
                2: 'Position unavailable. Check your connection or use Demo Mode.',
                3: 'Location request timed out. Use Demo Mode to continue.',
            };
            setError(messages[err.code] || 'Unknown location error.');
            setLoading(false);
            setPermissionState(err.code === 1 ? 'denied' : 'unavailable');
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            onSuccess,
            onError,
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
    };


    // Demo mode controls
    const setMockPosition = (lat, lon) => {
        setPosition([parseFloat(lat), parseFloat(lon)]);
        setAccuracy(0);
        setDemoMode(true);
        setError(null);
        setLoading(false);
        setPermissionState('granted');
        toggleDevMode(true);
    };

    const clearMockPosition = () => {
        setDemoMode(false);
        setLoading(true);
        setError(null);
        // Clear any existing watcher before starting a new one
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        requestLocation();
    };

    const toggleDevMode = (val) => {
        setDevModeEnabledState(val);
        localStorage.setItem('devModeEnabled', String(val));
        // If disabling, also exit demo mode if currently active
        if (!val) {
            setDemoMode(false);
            setPosition(null);
        }
    };

    // Expose the fallback so consumers can initialise maps before GPS arrives
    const displayPosition = position ?? NYC_FALLBACK;

    return (
        <LocationContext.Provider
            value={{
                position: displayPosition,  // [lat, lon] — always a valid pair
                rawPosition: position,      // null until first fix (useful for "waiting" UI)
                accuracy,
                error,
                loading,
                demoMode,
                permissionState,
                requestLocation,
                setMockPosition,
                clearMockPosition,
                devModeEnabled,
                toggleDevMode,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const ctx = useContext(LocationContext);
    if (!ctx) throw new Error('useLocation must be used inside <LocationProvider>');
    return ctx;
}