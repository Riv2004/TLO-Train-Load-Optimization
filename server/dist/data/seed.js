"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZONES = exports.DESTINATIONS = void 0;
exports.seedLocomotives = seedLocomotives;
exports.seedRailcars = seedRailcars;
exports.seedContainers = seedContainers;
// Synthetic master data. Crane fixed at (0,0); 9 orthogonal rail lines through (0,0);
// lines 1-5 run vertically at x = -4..0, lines 6-9 run horizontally at y = 1..4;
// 5 Indian destinations.
exports.DESTINATIONS = [
    { destId: 'MUM_101', name: 'Mumbai' },
    { destId: 'DEL_102', name: 'Delhi' },
    { destId: 'KOL_103', name: 'Kolkata' },
    { destId: 'MAA_104', name: 'Chennai' },
    { destId: 'BLR_105', name: 'Bengaluru' },
];
exports.ZONES = {
    'N-W': { x: -3, y: 3 }, 'S-W': { x: -4, y: -4 }, 'S-E': { x: 5, y: -3 }, 'N-E': { x: 2, y: 2 },
};
function rng(seed) {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const r1 = (n) => Math.round(n * 10) / 10;
function seedLocomotives() {
    // Lines 1-5 run vertically through the origin at x = -4..0 (orientation V),
    // lines 6-9 run horizontally through the origin at y = -4..-1 (orientation H).
    const vertical = [-4, -3, -2, -1, 1];
    const horizontal = [-4, -3, -2, -1];
    const lines = [];
    vertical.forEach((x, i) => lines.push({ railLine: i + 1, orientation: 'V', coord: x }));
    horizontal.forEach((y, i) => lines.push({ railLine: i + 6, orientation: 'H', coord: y }));
    return lines.map(({ railLine, orientation, coord }) => {
        const d = exports.DESTINATIONS[(railLine - 1) % 5];
        const unavailable = railLine === 4 || railLine === 8;
        // Locomotive sits one unit off the origin along its line.
        const coordinate = orientation === 'V'
            ? { x: coord, y: 2 }
            : { x: 2, y: coord };
        return {
            locoId: `LOC-0${railLine}0`, railLine, orientation, coordinate,
            status: unavailable ? 'Not Available' : 'Available',
            destination: d.name, destId: d.destId,
        };
    });
}
function seedRailcars() {
    const types = ['A', 'B', 'B', 'A', 'B'];
    return exports.DESTINATIONS.flatMap((d, di) => types.map((type, n) => ({
        railCarId: `RC-${(di + 1) * 100 + n}`, type, weight: type === 'A' ? 95000 : 190000,
        status: (n === 4 && (di === 0 || di === 3) ? 'LOADED' : 'Available'),
        order: null, coordinate: null, orientation: null, destId: d.destId,
    })));
}
function seedContainers() {
    const rand = rng(2026);
    const zoneIds = Object.keys(exports.ZONES);
    return exports.DESTINATIONS.flatMap((d, di) => Array.from({ length: 16 }, (_, i) => {
        const sizeFt = rand() < 0.55 ? 40 : 20;
        const zoneId = zoneIds[Math.floor(rand() * 4)];
        const p = rand(), t = rand();
        const heavy = i === 15; // one over-limit container per destination (rule R1)
        return {
            containerId: `CON-${(di + 1) * 1000 + i + 1}`, sizeFt,
            weight: heavy ? 77000 : Math.round((sizeFt === 40 ? 18000 + rand() * 16000 : 8000 + rand() * 10000) / 100) * 100,
            zoneId, coordinate: { x: r1(exports.ZONES[zoneId].x + (rand() - 0.5) * 3), y: r1(exports.ZONES[zoneId].y + (rand() - 0.5) * 3) },
            yardTier: t < 0.55 ? 0 : t < 0.8 ? 1 : 2,
            priority: p < 0.15 ? 'Critical' : p < 0.45 ? 'High' : 'Normal',
            status: 'Available', destId: d.destId,
        };
    }));
}
