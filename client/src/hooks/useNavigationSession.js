import { useState, useEffect, useRef } from 'react';
import { buildDirections, haversineDistance } from '../utils/directions';

const REROUTE_THRESHOLD_M = 40;
const REROUTE_COOLDOWN_MS = 30000;

export function useNavigationSession(position, routeCoords, onOffRoute) {
  const [navActive, setNavActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [directions, setDirections] = useState([]);

  const startTimeRef = useRef(null);
  const prevPositionRef = useRef(null);
  const cumulativeDistRef = useRef(0);
  const rerouteCooldownRef = useRef(false);

  const startSession = (route, transitStops) => {
    const dirs = buildDirections(route, transitStops);
    setDirections(dirs);
    setNavActive(true);
    setCurrentStepIndex(0);
    startTimeRef.current = new Date();
    prevPositionRef.current = null;
    cumulativeDistRef.current = 0;
    rerouteCooldownRef.current = false;
  };

  const endSession = () => {
    setNavActive(false);
    setDirections([]);
    setCurrentStepIndex(0);
    prevPositionRef.current = null;
    cumulativeDistRef.current = 0;
    rerouteCooldownRef.current = false;
  };

  useEffect(() => {
    if (!navActive || !directions.length) return;

    // Accumulate distance travelled
    if (prevPositionRef.current) {
      const [prevLat, prevLon] = prevPositionRef.current;
      const moved = haversineDistance(prevLat, prevLon, position[0], position[1]);
      cumulativeDistRef.current += moved / 1000; // metres → km
    }
    prevPositionRef.current = [position[0], position[1]];

    // Proximity detection — advance step when within 40m of target
    const step = directions[currentStepIndex];
    if (step?.targetCoord) {
      const [targetLat, targetLon] = step.targetCoord;
      const dist = haversineDistance(position[0], position[1], targetLat, targetLon);
      if (dist < 40) {
        setCurrentStepIndex(i => Math.min(i + 1, directions.length - 1));
        return; // on track, skip off-route check
      }
    }

    // Off-route detection — check distance to nearest route node
    if (
      routeCoords?.length &&
      onOffRoute &&
      !rerouteCooldownRef.current &&
      directions[currentStepIndex]?.type !== 'arrive'
    ) {
      const minDist = Math.min(
        ...routeCoords.map(([lat, lon]) =>
          haversineDistance(position[0], position[1], lat, lon)
        )
      );
      if (minDist > REROUTE_THRESHOLD_M) {
        rerouteCooldownRef.current = true;
        setTimeout(() => { rerouteCooldownRef.current = false; }, REROUTE_COOLDOWN_MS);
        onOffRoute();
      }
    }
  }, [position]);

  return {
    navActive,
    currentStepIndex,
    directions,
    startTimeRef,
    cumulativeDistRef,
    startSession,
    endSession,
  };
}