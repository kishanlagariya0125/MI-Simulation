# Smart Traffic Control System — Assembly V2.0 (MI Simulation)

[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)
[![Tests](https://img.shields.io/badge/Vitest-13%20Passed-brightgreen.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An interactive, real-time four-way traffic junction simulation and emergency vehicle preemption controller. Inspired by real traffic control room systems and built upon a preserved **NASM x86 Assembly** reference implementation (`innovativemi.asm`).

Designed with a professional **Light Gray (`#EEF0F2`) & Traffic Navy (`#365D7A`)** transportation engineering interface.

---

## 🚦 Key Features

### 1. Dual Operating Modes
- **Automatic Cycle**: Seamless, state-driven cycling between North–South and East–West corridors with safe 2-second yellow and 1-second all-red clearance intervals.
- **Manual Mode**: Direct road corridor selection (`NS` or `EW`) with strict collision-prevention interlocks.
- **Dynamic Traffic Densities**: Low (5s), Medium (8s), and High (12s) green-phase durations with corresponding vehicle generation rates.

### 2. Emergency Priority Preemption
- **Directional Requests**: Immediate priority routing for emergency ambulances approaching from **North (`B`)**, **South (`C`)**, **East (`D`)**, or **West (`E`)**.
- **Non-Loss FIFO Queue**: Handles multiple simultaneous emergency calls deterministically without dropping requests.
- **Safe State Transitions**: Conflicting green phases are gracefully truncated through Yellow $\rightarrow$ All-Red clearance before opening priority green corridors.

### 3. Realistic Vehicle Illustrations & Dedicated Ambulance
- **Top-Down 2D SVG Vehicles**: Rendered with realistic automotive proportions, contoured windshields, headlights, taillights, side mirrors, and authentic paint tones (`#D1D5DB`, `#F3F4F6`, `#374151`, `#4B5563`, `#1E3A5F`).
  - *Passenger Cars / Sedans*
  - *SUVs with extended bodies and roof rails*
  - *Commercial Delivery Vans with distinct rear cargo bays*
- **Distinct Medical Ambulance**: Dedicated emergency van with clinical white body, red side chevrons, bold red cross ($\boldsymbol{+}$) on the roof, and split blue/red emergency lightbar with realistic strobes.

### 4. Pedestrian Safety Crossing
- **Zebra Crosswalk Phase**: Press **`P`** to trigger safe pedestrian intervals.
- Conflicting motor vehicle corridors turn Red, walk indicators activate, and pedestrians safely traverse crosswalks with a synchronized countdown.

### 5. Telemetry & Analytics
- **Live Statistics**: Real-time tracking of vehicle throughput, ambulance clearances by direction, pedestrian counts, and peak cycle times.
- **Interactive Event Log**: Comprehensive chronological record of all phase changes and priority overrides, with directional filtering and CSV export.
- **NASM x86 Assembly Inspector**: In-app modal displaying the original low-level Assembly code and architectural mapping.

---

## ⌨️ Keyboard Shortcuts (Assembly Menu Mappings)

| Key | Action |
| :---: | :--- |
| **`A`** | Set Mode to **Automatic** |
| **`M`** | Toggle **Manual / Automatic** Mode |
| **`N`** | Select **North / South** Road (Manual Mode) |
| **`B`** | Request Ambulance from **NORTH** |
| **`C`** | Request Ambulance from **SOUTH** |
| **`D`** | Request Ambulance from **EAST** |
| **`E`** | Request Ambulance from **WEST** |
| **`P`** | Request **Pedestrian Crossing** |
| **`L`** | Set Traffic Density to **LOW (5s)** |
| **`H`** | Set Traffic Density to **HIGH (12s)** |
| **`Space`** | **Pause / Resume** Simulation |

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite 6.2
- **Styling**: Vanilla CSS with curated transportation engineering tokens
- **Vector Graphics**: Procedural Scalable Vector Graphics (SVG)
- **Icons**: Lucide React
- **Testing**: Vitest (13 comprehensive automated simulation test cases)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/kishanlagariya0125/mi-simulation.git

# Navigate to project directory
cd mi-simulation

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

---

## 📂 Project Structure

```
mi-simulation/
├── asm_reference/             # Original NASM x86 assembly reference files
│   └── innovativemi.asm       # Low-level controller source
├── public/                    # Static assets & audio cues
├── src/
│   ├── components/            # React UI components
│   │   ├── TrafficIntersection.tsx   # 4-way intersection simulation canvas
│   │   ├── VehicleIllustration.tsx   # Top-down SVG vehicle & ambulance renderer
│   │   ├── TrafficLight.tsx          # Realistic signal head & countdown
│   │   ├── ControlPanel.tsx          # Manual controls & emergency triggers
│   │   ├── WorkflowTimeline.tsx      # Real-time state progression
│   │   ├── StatisticsPanel.tsx       # Telemetry & directional distribution
│   │   ├── EventLog.tsx              # Filterable chronological event audit
│   │   ├── AssemblyInspectorModal.tsx# ASM source & logic mapping modal
│   │   └── Header.tsx                # Clock, status, speed controls
│   ├── simulation/            # Core deterministic simulation engines
│   │   ├── stateMachine.ts    # Traffic light state machine & safety rules
│   │   ├── emergencyManager.ts# Priority queue & preemption logic
│   │   ├── vehicleManager.ts  # Autonomous vehicle spawning & lane kinematics
│   │   ├── pedestrianManager.ts# Crosswalk pedestrian animation & timing
│   │   └── statisticsTracker.ts# Performance metrics & counters
│   ├── tests/                 # Vitest test suite (Tests A–M)
│   ├── config.ts              # System timings & lane coordinates
│   ├── App.tsx                # Main application orchestrator
│   └── index.css              # Light Gray & Traffic Navy design system
├── index.html                 # Entry point
└── package.json
```

---

## 📄 License

This project is licensed under the MIT License.
