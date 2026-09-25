# Changelog - Kunzite CoreFlow

All notable changes to the **Kunzite CoreFlow** project will be documented in this file.

---

## [vFinal 2.2] - 2026-09-24

### 🌡️ PMIC Thermal Balance & WALT Tuning
- **WALT Rate Limit Sweet Spot:** Adjusted `up_rate_limit_us` to `2500` ($2.5\text{ ms}$) and `down_rate_limit_us` to `8000` ($8\text{ ms}$) across all CPU policies. This eliminates aggressive voltage spikes on the `pm6450_tz` PMIC while maintaining instantaneous touch response.
- **Hispeed Threshold Refinement:** Raised `hispeed_load` to `95` to prevent micro-voltage spikes during minor background tasks.
- **Adreno GPU Idle Timer:** Enforced `idle_timer` at `80ms` on `/sys/class/kgsl/kgsl-3d0` to trigger rapid power-rail auto-suspend during idle state.

### 🛜 Radio & Standby Power Reduction
- **5G Modem Pinging Reduction:** Injected `settings put global 5g_icon_group_mode 0` to reduce unnecessary background modem pinging and ease load on IC Power.

### 💽 Unified Multi-Queue Storage Optimization
- **Primary Block Scheduler Migration:** Specifically migrated primary system/userdata block device (`sda`) from stock `cpq` to `mq-deadline`.
- **Targeted Storage Tunables:** Enforced `fifo_batch=8` across all block devices (`sda`–`sdf`) to drastically reduce I/O queue latency and accelerate app startup.
- **I/O Queue Harmony:** Standardized `nr_requests=128`, `read_ahead_kb=256KB`, and disabled `iostats` on all storage nodes.

### 🔄 Symmetric Restoration & Logging
- **1:1 Uninstaller Synchronization:** Fully updated `uninstall.sh` to restore `sda` to `cpq`, `fifo_batch` to factory default (`16`), `up_rate_limit_us` to `0`, and all global settings back to stock.
- **Log Preservation:** Preserved execution logs (`/tmp/kernel_tuning.log`) upon module uninstallation for seamless debugging.

---

## [vFinal 2.1] - 2026-09-24

### 🚀 CPU, Governor & Scheduler Refinements
- **Cluster Hispeed Freq Optimization:** Applied specific `hispeed_freq` targets ($1.38\text{ GHz}$ for LITTLE cluster, $1.61\text{ GHz}$ for BIG cluster) to maximize race-to-sleep efficiency.
- **Kernel Overhead Reduction:** Explicitly disabled `sched_schedstats` (`0`) to eliminate unnecessary CPU logging overhead.

### ⚡ Uclamp & Latency Tuning
- **Top-App Boost:** Enforced `latency_sensitive=1` and set a minimum boost threshold (`cpu.uclamp.min=11.00`) for seamless UI rendering and app responsiveness.
- **Input & Audio Priority:** Enabled `latency_sensitive=1` across `touch` and `audio` cgroups to eliminate input lag and prevent audio crackling under load.

### 🎵 Audio Pipeline & Speaker Perfection Injections
- **HyperOS Speaker Perfection Integration:** Integrated hardware HAL buffer correction (`adm.buffering.ms=1`, `period_size=96`), forced FastMixer execution (`onlyfast=true`, $64\text{ KB}$ offload headroom), and pinned audio processing exclusively to BIG cores (`cpuset.af`–`hso` on cores `4-7`).

### 📱 Network & Touch Response Properties
- **TCP Congestion Control:** Switched system default TCP congestion control to Google BBR (`net.ipv4.tcp_congestion_control=bbr`) for faster packet delivery and lower network latency.
- **Touch Calibration:** Injected geometric size calibration (`touch.size.calibration=geometric`) and pressure scaling (`touch.pressure.scale=0.001`) for instantaneous touch response.

### 🧹 Reversibility & Clean Code
- **Uninstall Script Sync:** Updated `uninstall.sh` to fully revert all new Uclamp nodes, TCP parameters, and vendor audio/touch properties back to stock settings (`resetprop -z`).

---

## [vFinal] - 2026-09-23

### ⚡ Project Rebrand & Target
- **Official Rebrand:** Rebranded project identity to **Kunzite CoreFlow**.
- **Hardware Target:** Specifically tuned for **Redmi Note 15 5G (SM6475)** running Snapdragon 6 Gen 3 SoC.

---
