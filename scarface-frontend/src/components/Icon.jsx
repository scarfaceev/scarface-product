import { Wifi, BrainCircuit, ShieldCheck, CloudRain, PlugZap, Hand, Gauge, MonitorCog, Zap, Sun, Home, Car, ArrowRight } from "lucide-react";
const map = { wifi: Wifi, brain: BrainCircuit, shield: ShieldCheck, cloud: CloudRain, plug: PlugZap, hand: Hand, monitor: MonitorCog, gauge: Gauge, zap: Zap, sun: Sun, home: Home, car: Car, arrow: ArrowRight };
export default function Icon({ name, size = 22 }) { const C = map[name] || Zap; return <C size={size} aria-hidden="true" />; }
