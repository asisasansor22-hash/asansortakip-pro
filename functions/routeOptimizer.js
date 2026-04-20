"use strict";

const ROAD_ROUTE_MAX_COORDS = Number(process.env.ROAD_ROUTE_MAX_COORDS || 100);
const EXACT_ROUTE_MAX_POINTS = Number(process.env.EXACT_ROUTE_MAX_POINTS || 16);
const ROUTE_IMPROVE_EPS = 0.0001;
const LARGE_ROUTE_COST = 999999999;
const OSRM_BASE_URL = (process.env.OSRM_BASE_URL || "https://router.project-osrm.org").replace(/\/+$/, "");
const OSRM_PROFILE = process.env.OSRM_PROFILE || "driving";
const OSRM_TIMEOUT_MS = Number(process.env.OSRM_TIMEOUT_MS || 9000);
const MATRIX_CACHE_TTL_MS = Number(process.env.MATRIX_CACHE_TTL_MS || 10 * 60 * 1000);
const MATRIX_CACHE_MAX = Number(process.env.MATRIX_CACHE_MAX || 80);

const matrixCache = new Map();

function httpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function normalizeCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizePoint(raw, index) {
  const lat = normalizeCoord(raw && raw.lat);
  const lng = normalizeCoord(raw && raw.lng);
  if (lat === null || lng === null) {
    throw httpError(400, "invalid-coordinate", "Durak koordinatları eksik veya geçersiz.");
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw httpError(400, "invalid-coordinate-range", "Durak koordinatı geçerli aralık dışında.");
  }
  return {
    id: raw && raw.id !== undefined ? raw.id : index,
    lat,
    lng,
    index
  };
}

function normalizePayload(payload) {
  const stopsRaw = Array.isArray(payload.stops) ? payload.stops : [];
  if (stopsRaw.length === 0) {
    throw httpError(400, "empty-stops", "Rota için en az bir durak gerekli.");
  }
  if (stopsRaw.length > 250) {
    throw httpError(400, "too-many-stops", "Tek rotada en fazla 250 durak desteklenir.");
  }
  const stops = stopsRaw.map(normalizePoint);
  let start = null;
  if (payload.start && payload.start.lat !== undefined && payload.start.lng !== undefined) {
    start = normalizePoint(payload.start, -1);
  }
  return { stops, start };
}

function deg2rad(v) {
  return v * (Math.PI / 180);
}

function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const r = 6371;
  const dLat = deg2rad(b.lat - a.lat);
  const dLng = deg2rad(b.lng - a.lng);
  const lat1 = deg2rad(a.lat);
  const lat2 = deg2rad(b.lat);
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return r * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function makeHaversineCost(stops, start) {
  return function cost(prevIdx, nextIdx) {
    const from = prevIdx === null ? start : stops[prevIdx];
    if (!from) return 0;
    return haversineKm(from, stops[nextIdx]);
  };
}

function makeMatrixCost(matrix, hasStart) {
  const offset = hasStart ? 1 : 0;
  return function cost(prevIdx, nextIdx) {
    const from = prevIdx === null ? (hasStart ? 0 : null) : prevIdx + offset;
    if (from === null) return 0;
    const to = nextIdx + offset;
    const row = matrix[from];
    const v = row && row[to];
    return Number.isFinite(v) ? v / 1000 : Infinity;
  };
}

function routeCost(order, costBetween) {
  let total = 0;
  let prev = null;
  for (const idx of order) {
    const cost = costBetween(prev, idx);
    total += Number.isFinite(cost) ? cost : LARGE_ROUTE_COST;
    prev = idx;
  }
  return total;
}

function selectRouteStarts(stops, costBetween, hasStart) {
  const all = stops.map((_, i) => i);
  if (stops.length <= 25) return all;
  const maxStarts = stops.length <= 40 ? 10 : 7;
  const starts = [];
  const seen = new Set();
  function add(idx) {
    if (idx === undefined || idx === null || seen.has(idx)) return;
    seen.add(idx);
    starts.push(idx);
  }
  if (hasStart) {
    const byStart = all.slice().sort((a, b) => costBetween(null, a) - costBetween(null, b));
    byStart.slice(0, Math.max(4, maxStarts - 2)).forEach(add);
    byStart.slice(-2).forEach(add);
  } else {
    add(all[0]);
    add(all[all.length - 1]);
    add(all.slice().sort((a, b) => stops[a].lng - stops[b].lng)[0]);
    add(all.slice().sort((a, b) => stops[b].lng - stops[a].lng)[0]);
    add(all.slice().sort((a, b) => stops[a].lat - stops[b].lat)[0]);
    add(all.slice().sort((a, b) => stops[b].lat - stops[a].lat)[0]);
  }
  all.forEach((idx) => {
    if (starts.length < maxStarts) add(idx);
  });
  return starts.slice(0, maxStarts);
}

function greedyRoute(stops, costBetween, firstIdx) {
  const remaining = stops.map((_, i) => i);
  const ordered = [];
  let current = null;
  if (firstIdx !== undefined && firstIdx !== null) {
    const firstPos = remaining.indexOf(firstIdx);
    if (firstPos >= 0) {
      current = remaining.splice(firstPos, 1)[0];
      ordered.push(current);
    }
  }
  while (remaining.length) {
    let bestPos = 0;
    let bestScore = Infinity;
    remaining.forEach((idx, pos) => {
      const score = current === null ? costBetween(null, idx) : costBetween(current, idx);
      if (score < bestScore) {
        bestScore = score;
        bestPos = pos;
      }
    });
    current = remaining.splice(bestPos, 1)[0];
    ordered.push(current);
  }
  return ordered;
}

function sweepRoute(stops, costBetween, hasStart, reverse) {
  if (stops.length <= 1) return stops.map((_, i) => i);
  const center = stops.reduce((a, p) => {
    a.lat += p.lat;
    a.lng += p.lng;
    return a;
  }, { lat: 0, lng: 0 });
  center.lat /= stops.length;
  center.lng /= stops.length;
  let ordered = stops.map((_, i) => i).sort((a, b) => {
    const aa = Math.atan2(stops[a].lat - center.lat, stops[a].lng - center.lng);
    const bb = Math.atan2(stops[b].lat - center.lat, stops[b].lng - center.lng);
    return reverse ? bb - aa : aa - bb;
  });
  if (hasStart) {
    let bestPos = 0;
    let bestCost = Infinity;
    ordered.forEach((idx, pos) => {
      const cost = costBetween(null, idx);
      if (cost < bestCost) {
        bestCost = cost;
        bestPos = pos;
      }
    });
    ordered = ordered.slice(bestPos).concat(ordered.slice(0, bestPos));
  }
  return ordered;
}

function optimizeExact(stops, costBetween) {
  const n = stops.length;
  if (n === 0) return [];
  if (n > EXACT_ROUTE_MAX_POINTS) return null;
  const stateCount = 1 << n;
  const dp = new Float64Array(stateCount * n);
  const parent = new Int16Array(stateCount * n);
  for (let i = 0; i < dp.length; i++) dp[i] = Infinity;
  parent.fill(-1);
  for (let i = 0; i < n; i++) {
    let startCost = costBetween(null, i);
    if (!Number.isFinite(startCost)) startCost = LARGE_ROUTE_COST;
    dp[(1 << i) * n + i] = startCost;
  }
  for (let mask = 1; mask < stateCount; mask++) {
    for (let last = 0; last < n; last++) {
      const baseIdx = mask * n + last;
      const baseCost = dp[baseIdx];
      if (!Number.isFinite(baseCost)) continue;
      for (let next = 0; next < n; next++) {
        const bit = 1 << next;
        if (mask & bit) continue;
        let step = costBetween(last, next);
        if (!Number.isFinite(step)) step = LARGE_ROUTE_COST;
        const nextMask = mask | bit;
        const nextIdx = nextMask * n + next;
        const candidate = baseCost + step;
        if (candidate + ROUTE_IMPROVE_EPS < dp[nextIdx]) {
          dp[nextIdx] = candidate;
          parent[nextIdx] = last;
        }
      }
    }
  }
  const fullMask = stateCount - 1;
  let bestLast = -1;
  let bestCost = Infinity;
  for (let end = 0; end < n; end++) {
    const cost = dp[fullMask * n + end];
    if (cost < bestCost) {
      bestCost = cost;
      bestLast = end;
    }
  }
  if (bestLast < 0 || bestCost >= LARGE_ROUTE_COST / 2) return null;
  const route = [];
  let current = bestLast;
  let currentMask = fullMask;
  while (current >= 0) {
    route.push(current);
    const idx = currentMask * n + current;
    const prev = parent[idx];
    currentMask = currentMask ^ (1 << current);
    current = prev;
  }
  return route.reverse();
}

function improveTwoOpt(order, costBetween) {
  if (order.length < 4) return order.slice();
  let best = order.slice();
  let bestCost = routeCost(best, costBetween);
  const maxPasses = order.length > 60 ? 2 : 4;
  let pass = 0;
  let improved = true;
  while (improved && pass < maxPasses) {
    improved = false;
    pass++;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
        const candidateCost = routeCost(candidate, costBetween);
        if (candidateCost + ROUTE_IMPROVE_EPS < bestCost) {
          best = candidate;
          bestCost = candidateCost;
          improved = true;
        }
      }
    }
  }
  return best;
}

function improveRelocate(order, costBetween) {
  if (order.length < 3) return order.slice();
  let best = order.slice();
  let bestCost = routeCost(best, costBetween);
  const maxPasses = order.length > 60 ? 1 : 3;
  let pass = 0;
  let improved = true;
  while (improved && pass < maxPasses) {
    improved = false;
    pass++;
    for (let i = 0; i < best.length; i++) {
      for (let pos = 0; pos <= best.length; pos++) {
        if (pos === i || pos === i + 1) continue;
        const candidate = best.slice();
        const moved = candidate.splice(i, 1)[0];
        const insertAt = pos > i ? pos - 1 : pos;
        candidate.splice(insertAt, 0, moved);
        const candidateCost = routeCost(candidate, costBetween);
        if (candidateCost + ROUTE_IMPROVE_EPS < bestCost) {
          best = candidate;
          bestCost = candidateCost;
          improved = true;
        }
      }
    }
  }
  return best;
}

function improveSwap(order, costBetween) {
  if (order.length < 4) return order.slice();
  let best = order.slice();
  let bestCost = routeCost(best, costBetween);
  const maxPasses = order.length > 70 ? 1 : 2;
  let pass = 0;
  let improved = true;
  while (improved && pass < maxPasses) {
    improved = false;
    pass++;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const candidate = best.slice();
        const tmp = candidate[i];
        candidate[i] = candidate[j];
        candidate[j] = tmp;
        const candidateCost = routeCost(candidate, costBetween);
        if (candidateCost + ROUTE_IMPROVE_EPS < bestCost) {
          best = candidate;
          bestCost = candidateCost;
          improved = true;
        }
      }
    }
  }
  return best;
}

function improveSegmentRelocate(order, costBetween) {
  if (order.length < 5) return order.slice();
  let best = order.slice();
  let bestCost = routeCost(best, costBetween);
  const maxPasses = order.length > 70 ? 1 : 2;
  let pass = 0;
  let improved = true;
  while (improved && pass < maxPasses) {
    improved = false;
    pass++;
    for (let segmentSize = 2; segmentSize <= 3; segmentSize++) {
      if (segmentSize >= best.length) continue;
      for (let i = 0; i <= best.length - segmentSize; i++) {
        for (let pos = 0; pos <= best.length; pos++) {
          if (pos >= i && pos <= i + segmentSize) continue;
          const candidate = best.slice();
          const segment = candidate.splice(i, segmentSize);
          const insertAt = pos > i ? pos - segmentSize : pos;
          candidate.splice(insertAt, 0, ...segment);
          const candidateCost = routeCost(candidate, costBetween);
          if (candidateCost + ROUTE_IMPROVE_EPS < bestCost) {
            best = candidate;
            bestCost = candidateCost;
            improved = true;
          }
        }
      }
    }
  }
  return best;
}

function polishRoute(order, costBetween) {
  let best = order.slice();
  best = improveTwoOpt(best, costBetween);
  best = improveRelocate(best, costBetween);
  best = improveSwap(best, costBetween);
  best = improveSegmentRelocate(best, costBetween);
  best = improveTwoOpt(best, costBetween);
  return best;
}

function optimizeOrder(stops, costBetween, hasStart) {
  if (stops.length <= 1) return stops.map((_, i) => i);
  const exact = optimizeExact(stops, costBetween);
  if (exact) return exact;

  const candidates = [];
  selectRouteStarts(stops, costBetween, hasStart).forEach((firstIdx) => {
    candidates.push(greedyRoute(stops, costBetween, firstIdx));
  });
  candidates.push(sweepRoute(stops, costBetween, hasStart, false));
  candidates.push(sweepRoute(stops, costBetween, hasStart, true));

  let bestOrder = null;
  let bestCost = Infinity;
  candidates.forEach((candidate) => {
    candidate = polishRoute(candidate, costBetween);
    const candidateCost = routeCost(candidate, costBetween);
    if (candidateCost < bestCost) {
      bestCost = candidateCost;
      bestOrder = candidate;
    }
  });
  return bestOrder || stops.map((_, i) => i);
}

function cacheGet(key) {
  const entry = matrixCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > MATRIX_CACHE_TTL_MS) {
    matrixCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  matrixCache.set(key, { createdAt: Date.now(), value });
  while (matrixCache.size > MATRIX_CACHE_MAX) {
    const firstKey = matrixCache.keys().next().value;
    matrixCache.delete(firstKey);
  }
}

function matrixCacheKey(coords) {
  return coords.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
}

async function fetchRoadMatrix(stops, start) {
  const hasStart = !!start;
  const coords = (hasStart ? [start] : []).concat(stops);
  if (coords.length > ROAD_ROUTE_MAX_COORDS) {
    return { matrix: null, source: "haversine", warning: "road-matrix-limit" };
  }

  const key = matrixCacheKey(coords);
  const cached = cacheGet(key);
  if (cached) return Object.assign({ cached: true }, cached);

  const coordStr = coords.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_BASE_URL}/table/v1/${OSRM_PROFILE}/${coordStr}?annotations=distance`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      return { matrix: null, source: "haversine", warning: `osrm-${res.status}` };
    }
    const data = await res.json();
    if (data.code && data.code !== "Ok") {
      return { matrix: null, source: "haversine", warning: `osrm-${data.code}` };
    }
    if (!Array.isArray(data.distances) || data.distances.length !== coords.length) {
      return { matrix: null, source: "haversine", warning: "osrm-invalid-matrix" };
    }
    const value = { matrix: data.distances, source: "osrm" };
    cacheSet(key, value);
    return value;
  } catch (error) {
    return { matrix: null, source: "haversine", warning: error && error.name === "AbortError" ? "osrm-timeout" : "osrm-error" };
  } finally {
    clearTimeout(timer);
  }
}

async function optimizeRoute(payload) {
  const { stops, start } = normalizePayload(payload);
  const matrixResult = await fetchRoadMatrix(stops, start);
  const hasRoadMatrix = Array.isArray(matrixResult.matrix);
  const costBetween = hasRoadMatrix ? makeMatrixCost(matrixResult.matrix, !!start) : makeHaversineCost(stops, start);
  const order = optimizeOrder(stops, costBetween, !!start);
  const totalKm = routeCost(order, costBetween);
  const warnings = [];
  if (matrixResult.warning) warnings.push(matrixResult.warning);
  return {
    orderedIds: order.map((idx) => stops[idx].id),
    totalKm: Number.isFinite(totalKm) && totalKm < LARGE_ROUTE_COST / 2 ? Number(totalKm.toFixed(2)) : null,
    stopCount: stops.length,
    mode: stops.length <= EXACT_ROUTE_MAX_POINTS ? "exact" : "heuristic",
    distanceSource: hasRoadMatrix ? "osrm-road-distance" : "haversine-fallback",
    cached: !!matrixResult.cached,
    warnings
  };
}

module.exports = {
  optimizeRoute,
  _private: {
    haversineKm,
    optimizeOrder,
    makeHaversineCost
  }
};
