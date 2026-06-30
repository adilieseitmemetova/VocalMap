import {
  ArrowDown,
  ArrowUp,
  Circle,
  CircleDot,
  Dot,
  Minus,
  MoveHorizontal,
  Wind
} from "lucide-react";
import type { ComponentType } from "react";
import type { Marker, MarkerIconName } from "./types";

export const MARKERS: Marker[] = [
  {
    id: "up",
    label: "Up",
    meaning: "Идет на повышение",
    color: "#1aae39",
    icon: "up"
  },
  {
    id: "down",
    label: "Down",
    meaning: "Идет на понижение",
    color: "#0075de",
    icon: "down"
  },
  {
    id: "vib",
    label: "Vib",
    meaning: "Вибрато",
    color: "#8f4fd7",
    icon: "wave"
  },
  {
    id: "hold",
    label: "Hold",
    meaning: "Тянуть звук",
    color: "#c69214",
    icon: "line"
  },
  {
    id: "breath",
    label: "Breath",
    meaning: "Взять дыхание",
    color: "#2a9d99",
    icon: "breath"
  },
  {
    id: "accent",
    label: "Accent",
    meaning: "Акцент",
    color: "#dc2f2f",
    icon: "accent"
  },
  {
    id: "soft",
    label: "Soft",
    meaning: "Мягко",
    color: "#ff64c8",
    icon: "soft"
  },
  {
    id: "strong",
    label: "Strong",
    meaning: "Сильнее",
    color: "#dd5b00",
    icon: "strong"
  }
];

export const markerById = new Map(MARKERS.map((marker) => [marker.id, marker]));

export const markerIcons: Record<MarkerIconName, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  up: ArrowUp,
  down: ArrowDown,
  wave: MoveHorizontal,
  line: Minus,
  breath: Wind,
  accent: Dot,
  soft: Circle,
  strong: CircleDot
};

