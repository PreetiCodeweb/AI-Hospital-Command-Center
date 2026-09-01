"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bed,
  BrainCircuit,
  Building2,
  ChevronRight,
  Clock3,
  Gauge,
  Hospital,
  MapPin,
  Monitor,
  Network,
  ShieldCheck,
  Stethoscope,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { WingWorkspace } from "./WingWorkspace";

const baseWings = [
  {
    id: "emergency",
    label: "Emergency wing",
    short: "ED",
    value: "81%",
    status: "High load",
    tone: "high",
    patients: "142",
    beds: "18",
    staff: "68%",
    x: 7,
    y: 34,
    icon: Activity,
    detail:
      "Arrival velocity is 15% above baseline. Triage is the next predicted constraint.",
  },
  {
    id: "icu",
    label: "Critical care wing",
    short: "ICU",
    value: "94%",
    status: "Critical",
    tone: "critical",
    patients: "42",
    beds: "3",
    staff: "52%",
    x: 36,
    y: 9,
    icon: HeartIcon,
    detail:
      "Capacity threshold is approaching. Reserve beds and prepare ventilators for the evening window.",
  },
  {
    id: "surgery",
    label: "Surgical wing",
    short: "OR",
    value: "68%",
    status: "Moderate",
    tone: "moderate",
    patients: "26",
    beds: "21",
    staff: "74%",
    x: 68,
    y: 9,
    icon: Stethoscope,
    detail:
      "Turnover is stable. Three low-priority procedures can be flexed if pressure increases.",
  },
  {
    id: "radiology",
    label: "Imaging wing",
    short: "RAD",
    value: "57%",
    status: "Normal",
    tone: "normal",
    patients: "81",
    beds: "12",
    staff: "88%",
    x: 36,
    y: 76,
    icon: ScanIcon,
    detail:
      "Imaging capacity is healthy with a 14-minute median queue and strong staff coverage.",
  },
  {
    id: "ward",
    label: "General ward wing",
    short: "WARD",
    value: "76%",
    status: "Moderate",
    tone: "moderate",
    patients: "318",
    beds: "47",
    staff: "71%",
    x: 68,
    y: 76,
    icon: Bed,
    detail:
      "Discharge velocity is slightly below target. Step-down capacity is available for overflow.",
  },
  {
    id: "pediatrics",
    label: "Pediatric wing",
    short: "PEDS",
    value: "48%",
    status: "Normal",
    tone: "normal",
    patients: "63",
    beds: "29",
    staff: "91%",
    x: 7,
    y: 76,
    icon: Users,
    detail:
      "Pediatric operations are stable with low predicted risk over the next 12 hours.",
  },
];

function HeartIcon({ size = 20 }: { size?: number }) {
  return <Activity size={size} />;
}
function ScanIcon({ size = 20 }: { size?: number }) {
  return <Monitor size={size} />;
}
function cx(...items: (string | false | undefined)[]) {
  return items.filter(Boolean).join(" ");
}
const modeAdjustments: Record<string, number> = {
  Live: 0,
  Historical: -8,
  Forecast: 7,
  Simulation: 14,
};

export function DigitalTwinGraph() {
  const [selectedId, setSelectedId] = useState("icu");
  const [mode, setMode] = useState("Live");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("18 seconds ago");
  const [centering, setCentering] = useState(false);
  const [destination, setDestination] = useState<{
    departmentId: string;
    view: string;
  } | null>(null);
  const visibleWings = baseWings.map((wing) => {
    const adjustment = modeAdjustments[mode] || 0;
    const occupancy = Math.max(
      22,
      Math.min(99, Number.parseInt(wing.value, 10) + adjustment),
    );
    const patients = Math.max(
      12,
      Math.round(Number.parseInt(wing.patients, 10) * (1 + adjustment / 100)),
    );
    const status =
      occupancy >= 90
        ? "Critical"
        : occupancy >= 78
          ? "High load"
          : occupancy >= 65
            ? "Moderate"
            : "Normal";
    const tone =
      occupancy >= 90
        ? "critical"
        : occupancy >= 78
          ? "high"
          : occupancy >= 65
            ? "moderate"
            : "normal";
    return {
      ...wing,
      value: `${occupancy}%`,
      patients: `${patients}`,
      status,
      tone,
    };
  });
  const wings = visibleWings;
  const selected =
    visibleWings.find((wing) => wing.id === selectedId) || visibleWings[1];
  const networkHealth = Math.max(
    64,
    Math.min(96, 82 - (modeAdjustments[mode] || 0)),
  );
  const activeFlow = Math.round(
    1248 * (1 + (modeAdjustments[mode] || 0) / 100),
  );
  const pressureWindow =
    mode === "Historical"
      ? "Completed"
      : mode === "Forecast"
        ? "2h 40m"
        : mode === "Simulation"
          ? "1h 55m"
          : "4h 05m";
  const SelectedIcon = selected.icon;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const departmentId = params.get("wing");
    if (departmentId && wings.some((wing) => wing.id === departmentId)) {
      setSelectedId(departmentId);
      setDestination({ departmentId, view: params.get("view") || "workspace" });
    }
  }, []);
  if (destination)
    return (
      <WingWorkspace
        departmentId={destination.departmentId}
        view={destination.view}
      />
    );

  return (
    <div className="graph-twin-page">
      <div className="graph-twin-head">
        <div>
          <span className="eyebrow">Operational digital twin / graph view</span>
          <h1>Hospital digital twin</h1>
          <p>
            Explore each department wing as a live node in the Northstar care
            network.
          </p>
        </div>
        <div className="graph-head-actions">
          <div className="graph-mode-tabs">
            {["Live", "Historical", "Forecast", "Simulation"].map((item) => (
              <button
                key={item}
                className={mode === item ? "selected" : ""}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <span className="graph-live">
            <i /> {mode} model
          </span>
        </div>
      </div>
      <div className="graph-summary">
        <div>
          <Network size={17} />
          <span>Network health</span>
          <strong>{networkHealth}%</strong>
        </div>
        <div>
          <Zap size={17} />
          <span>Active patient flow</span>
          <strong>{activeFlow.toLocaleString()}</strong>
        </div>
        <div>
          <Clock3 size={17} />
          <span>
            {mode === "Historical"
              ? "Last pressure window"
              : "Next pressure window"}
          </span>
          <strong>{pressureWindow}</strong>
        </div>
        <div>
          <ShieldCheck size={17} />
          <span>Model confidence</span>
          <strong>
            {mode === "Historical"
              ? "96%"
              : mode === "Simulation"
                ? "84%"
                : "91%"}
          </strong>
        </div>
      </div>
      <div className="graph-layout">
        <section className="panel graph-canvas-panel">
          <div className="graph-canvas-toolbar">
            <div>
              <strong>Care network topology</strong>
              <span>Click a wing to inspect its operational state</span>
            </div>
            <div>
              <button
                className={cx("icon-button", centering && "active-pulse")}
                aria-label="Center network"
                onClick={() => {
                  setSelectedId("icu");
                  setCentering(true);
                  window.setTimeout(() => setCentering(false), 700);
                }}
              >
                <CrosshairIcon />
              </button>
              <button
                className="icon-button"
                aria-label="Refresh twin"
                disabled={refreshing}
                onClick={() => {
                  setRefreshing(true);
                  window.setTimeout(() => {
                    setRefreshing(false);
                    setLastUpdatedLabel("just now");
                  }, 800);
                }}
              >
                <Activity size={16} className={refreshing ? "spinning" : ""} />
              </button>
            </div>
          </div>
          <div className="network-canvas">
            <svg
              className="network-lines"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="flowTeal" x1="0" x2="1">
                  <stop stopColor="#20d6c7" stopOpacity=".2" />
                  <stop offset=".5" stopColor="#20d6c7" />
                  <stop offset="1" stopColor="#38bdf8" stopOpacity=".2" />
                </linearGradient>
                <linearGradient id="flowRed" x1="0" x2="1">
                  <stop stopColor="#ef646b" stopOpacity=".2" />
                  <stop offset=".5" stopColor="#ef646b" />
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity=".2" />
                </linearGradient>
              </defs>
              <path
                className="network-path red-path"
                d="M16 42 C25 37, 28 25, 43 20"
              />
              <path className="network-path" d="M16 42 C29 41, 37 28, 50 20" />
              <path className="network-path" d="M16 42 C31 47, 48 46, 73 20" />
              <path className="network-path" d="M16 42 C27 61, 35 74, 43 84" />
              <path className="network-path" d="M16 42 C34 53, 57 65, 73 84" />
              <path className="network-path" d="M50 20 C53 36, 64 55, 73 84" />
              <path className="network-path" d="M43 84 C53 81, 64 82, 73 84" />
            </svg>
            <div className="network-center">
              <div className="center-orbit">
                <Hospital size={27} />
              </div>
              <strong>NORTHSTAR</strong>
              <span>MEDICAL CENTER</span>
              <small>
                <i /> Core telemetry online
              </small>
            </div>
            {wings.map((wing) => {
              const Icon = wing.icon;
              return (
                <motion.button
                  key={wing.id}
                  whileHover={{ scale: 1.04 }}
                  className={cx(
                    "wing-node",
                    wing.tone,
                    selectedId === wing.id && "selected",
                  )}
                  style={{ left: `${wing.x}%`, top: `${wing.y}%` }}
                  onClick={() => setSelectedId(wing.id)}
                >
                  <div className="wing-node-icon">
                    <Icon size={16} />
                  </div>
                  <div className="wing-node-copy">
                    <strong>{wing.short}</strong>
                    <span>{wing.label}</span>
                  </div>
                  <b>{wing.value}</b>
                  <em>{wing.status}</em>
                  <i className="wing-signal" />
                </motion.button>
              );
            })}
            <div className="graph-flow-label flow-label-one">
              <span>Admissions</span>
              <i />
            </div>
            <div className="graph-flow-label flow-label-two">
              <span>Step-down flow</span>
              <i />
            </div>
          </div>
          <div className="graph-legend">
            <span>
              <i className="normal-dot" />
              Stable
            </span>
            <span>
              <i className="moderate-dot" />
              Pressure building
            </span>
            <span>
              <i className="critical-dot" />
              Critical attention
            </span>
            <span className="graph-telemetry">
              <i />
              Updated {lastUpdatedLabel}
            </span>
          </div>
        </section>
        <aside className="panel wing-detail-panel">
          <div className="wing-detail-top">
            <span className={cx("detail-status", selected.tone)}>
              <i /> {selected.status}
            </span>
            <span className="detail-id">NODE / {selected.short}-04</span>
          </div>
          <div className="detail-icon-wrap">
            <SelectedIcon size={22} />
          </div>
          <span className="eyebrow">Selected department wing</span>
          <h2>{selected.label}</h2>
          <p>{selected.detail}</p>
          <div className="detail-metric-grid">
            <div>
              <Gauge size={15} />
              <strong>{selected.value}</strong>
              <span>Occupancy</span>
            </div>
            <div>
              <Users size={15} />
              <strong>{selected.patients}</strong>
              <span>Patients</span>
            </div>
            <div>
              <Bed size={15} />
              <strong>{selected.beds}</strong>
              <span>Available beds</span>
            </div>
            <div>
              <Activity size={15} />
              <strong>{selected.staff}</strong>
              <span>Staff capacity</span>
            </div>
          </div>
          <div className="wing-insight">
            <BrainCircuit size={17} />
            <div>
              <strong>AI signal</strong>
              <span>
                Demand is expected to rise{" "}
                <b>{selected.tone === "critical" ? "18%" : "9%"}</b> across this
                wing by 8 PM.
              </span>
            </div>
          </div>
          <button
            className="primary-button wide"
            onClick={() =>
              (window.location.href = `/digital-twin?wing=${selectedId}&view=workspace&mode=${mode.toLowerCase()}`)
            }
          >
            Open wing workspace <ArrowRight size={16} />
          </button>
          <button
            className="detail-link"
            onClick={() =>
              (window.location.href = `/digital-twin?wing=${selectedId}&view=flow&mode=${mode.toLowerCase()}`)
            }
          >
            View patient flow graph <ChevronRight size={15} />
          </button>
        </aside>
      </div>
    </div>
  );
}
function CrosshairIcon() {
  return <MapPin size={16} />;
}
