// simulator.js - Real-time GPS movement simulation along route waypoints

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function startSimulator(buses, routes, io) {
  const STEP_SPEED = 0.07; // fraction of segment advanced per tick

  const intervalId = setInterval(() => {
    let hasUpdates = false;

    buses.forEach(bus => {
      if (!bus.isSimulating) return;

      const route = routes.find(r => r.id === bus.routeId);
      if (!route || !route.waypoints || route.waypoints.length < 2) return;

      const waypoints = route.waypoints;
      const totalPoints = waypoints.length;

      if (bus.waypointProgress === undefined) bus.waypointProgress = 0.0;
      if (bus.direction === undefined) bus.direction = 1;
      if (typeof bus.currentWaypointIndex !== 'number' || isNaN(bus.currentWaypointIndex)) {
        bus.currentWaypointIndex = 0;
      }

      // Advance progress along current segment
      bus.waypointProgress += STEP_SPEED;

      if (bus.waypointProgress >= 1.0) {
        bus.waypointProgress = 0.0;
        bus.currentWaypointIndex += bus.direction;

        // Turn around smoothly at route endpoints
        if (bus.currentWaypointIndex >= totalPoints - 1) {
          bus.direction = -1;
          bus.currentWaypointIndex = totalPoints - 2;
        } else if (bus.currentWaypointIndex <= 0) {
          bus.direction = 1;
          bus.currentWaypointIndex = 0;
        }
      }

      // Ensure indexes are always within bounds
      const idx1 = Math.max(0, Math.min(totalPoints - 1, bus.currentWaypointIndex));
      const nextIdx = bus.direction === 1 ? idx1 + 1 : idx1 - 1;
      const idx2 = Math.max(0, Math.min(totalPoints - 1, nextIdx));

      const p1 = waypoints[idx1];
      const p2 = waypoints[idx2] || p1;

      if (!p1 || !p2) return;

      // Linear interpolation between waypoints
      const lat = p1[0] + (p2[0] - p1[0]) * bus.waypointProgress;
      const lng = p1[1] + (p2[1] - p1[1]) * bus.waypointProgress;

      bus.currentLocation = {
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5))
      };

      // Slight natural speed fluctuation around base speed
      const baseSpeed = bus.targetSpeed || 40;
      const speedVariation = (Math.random() * 3 - 1.5);
      bus.speed = Math.max(15, Math.min(65, Math.round(baseSpeed + speedVariation)));

      // Calculate upcoming stop and ETA
      if (route.stops && route.stops.length > 0) {
        let closestUpcomingStop = null;
        let shortestDist = Infinity;

        route.stops.forEach(stop => {
          const dist = getDistanceKm(bus.currentLocation.lat, bus.currentLocation.lng, stop.lat, stop.lng);
          if (dist < shortestDist) {
            shortestDist = dist;
            closestUpcomingStop = stop;
          }
        });

        if (closestUpcomingStop) {
          bus.nextStop = closestUpcomingStop.name;
          const etaMinutes = Math.max(1, Math.round((shortestDist / (bus.speed || 30)) * 60));
          bus.etaNextStop = `${etaMinutes} mins`;
        }
      }

      bus.lastUpdated = new Date().toISOString();
      hasUpdates = true;
    });

    if (hasUpdates && io) {
      io.emit('buses_update', buses);
    }
  }, 1500);

  return intervalId;
}
