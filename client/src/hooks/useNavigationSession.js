import { useState, useEffect, useRef } from 'react';
import { buildDirections, haversineDistance } from '../utils/directions';

export function useNavigationSession(position) {
  const [navActive, setNavActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [directions, setDirections] = useState([]);

  const startTimeRef = useRef(null);
  const prevPositionRef = useRef(null);
  const cumulativeDistRef = useRef(0);

  const startSession = (route, transitStops) => {
    const dirs = buildDirections(route, transitStops);
    setDirections(dirs);
    setNavActive(true);
    setCurrentStepIndex(0);
    startTimeRef.current = new Date();
    prevPositionRef.current = null;
    cumulativeDistRef.current = 0;
  };

  const endSession = () => {
    setNavActive(false);
    setDirections([]);
    setCurrentStepIndex(0);
    prevPositionRef.current = null;
    cumulativeDistRef.current = 0;
  };

  // Proximity detection — advance step when within 40m of target
  useEffect(() => {
    if (!navActive || !directions.length) return;

    // Accumulate distance travelled
    if (prevPositionRef.current) {
      const [prevLat, prevLon] = prevPositionRef.current;
      const moved = haversineDistance(prevLat, prevLon, position[0], position[1]);
      cumulativeDistRef.current += moved / 1000; // metres → km
    }
    prevPositionRef.current = [position[0], position[1]];

    // Check proximity to current step target
    const step = directions[currentStepIndex];
    if (!step?.targetCoord) return;
    const [targetLat, targetLon] = step.targetCoord;
    const dist = haversineDistance(position[0], position[1], targetLat, targetLon);
    if (dist < 40) {
      setCurrentStepIndex(i => Math.min(i + 1, directions.length - 1));
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