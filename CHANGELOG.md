# Changelog - Kunzite CoreFlow

All notable changes to the **Kunzite CoreFlow** project will be documented in this file.

---

## [vFinal 2.2] - 2026-09-24

### 🌡️ PMIC Thermal Balance & WALT Tuning
- **WALT Rate Limit Sweet Spot:** Adjusted `up_rate_limit_us` to `2500` ($2.5\text{ ms}$) and `down_rate_limit_us` to `8000` ($8\text{ ms}$) across all CPU policies[span_0](start_span)[span_0](end_span)[span_1](start_span)[span_1](end_span). This eliminates aggressive voltage spikes on the `pm6450_tz` PMIC while maintaining instantaneous touch response[span_2](start_span)[span_2](end_span)[span_3](start_span)[span_3](end_span).
- **Hispeed Threshold Refinement:** Raised `hispeed_load` to `95` to prevent micro-voltage spikes during minor background tasks[span_4](start_span)[span_4](end_span)[span_5](start_span)[span_5](end_span).
- **Adreno GPU Idle Timer:** Enforced `idle_timer` at `80ms` on `/sys/class/kgsl/kgsl-3d0` to trigger rapid power-rail auto-suspend during idle state[span_6](start_span)[span_6](end_span)[span_7](start_span)[span_7](end_span).

### 🛜 Radio & Standby Power Reduction
- **5G Modem Pinging Reduction:** Injected `settings put global 5g_icon_group_mode 0` to reduce unnecessary background modem pinging and ease load on IC Power[span_8](start_span)[span_8](end_span)[span_9](start_span)[span_9](end_span).

### 💽 Unified Multi-Queue Storage Optimization
- **Primary Block Scheduler Migration:** Specifically migrated primary system/userdata block device (`sda`) from stock `cpq` to `mq-deadline`[span_10](start_span)[span_10](end_span)[span_11](start_span)[span_11](end_span).
- **Targeted Storage Tunables:** Enforced `fifo_batch=8` across all block devices (`sda`–`sdf`) to drastically reduce I/O queue latency and accelerate app startup[span_12](start_span)[span_12](end_span)[span_13](start_span)[span_13](end_span).
- **I/O Queue Harmony:** Standardized `nr_requests=128`, `read_ahead_kb=256KB`, and disabled `iostats` on all storage nodes[span_14](start_span)[span_14](end_span)[span_15](start_span)[span_15](end_span).

### 🔄 Symmetric Restoration & Logging
- **1:1 Uninstaller Synchronization:** Fully updated `uninstall.sh` to restore `sda` to `cpq`, `fifo_batch` to factory default (`16`), `up_rate_limit_us` to `0`, and all global settings back to stock[span_16](start_span)[span_16](end_span)[span_17](start_span)[span_17](end_span).
- **Log Preservation:** Preserved execution logs (`/tmp/kernel_tuning.log`) upon module uninstallation for seamless debugging[span_18](start_span)[span_18](end_span)[span_19](start_span)[span_19](end_span).

---

## [vFinal 2.1] - 2026-09-24

### 🚀 CPU, Governor & Scheduler Refinements
- **Cluster Hispeed Freq Optimization:** Applied specific `hispeed_freq` targets ($1.38\text{ GHz}$ for LITTLE cluster, $1.61\text{ GHz}$ for BIG cluster) to maximize race-to-sleep efficiency.
- **Kernel Overhead Reduction:** Explicitly disabled `sched_schedstats` (`0`) to eliminate unnecessary CPU logging overhead[span_20](start_span)[span_20](end_span)[span_21](start_span)[span_21](end_span)[span_22](start_span)[span_22](end_span).

### ⚡ Uclamp & Latency Tuning
- **Top-App Boost:** Enforced `latency_sensitive=1` and set a minimum boost threshold (`cpu.uclamp.min=11.00`) for seamless UI rendering and app responsiveness[span_23](start_span)[span_23](end_span)[span_24](start_span)[span_24](end_span)[span_25](start_span)[span_25](end_span).
- **Input & Audio Priority:** Enabled `latency_sensitive=1` across `touch` and `audio` cgroups to eliminate input lag and prevent audio crackling under load[span_26](start_span)[span_26](end_span)[span_27](start_span)[span_27](end_span)[span_28](start_span)[span_28](end_span).

### 🎵 Audio Pipeline & Speaker Perfection Injections
- **HyperOS Speaker Perfection Integration:** Integrated hardware HAL buffer correction (`adm.buffering.ms=1`, `period_size=96`), forced FastMixer execution (`onlyfast=true`, $64\text{ KB}$ offload headroom), and pinned audio processing exclusively to BIG cores (`cpuset.af`–`hso` on cores `4-7`)[span_29](start_span)[span_29](end_span)[span_30](start_span)[span_30](end_span)[span_31](start_span)[span_31](end_span).

### 📱 Network & Touch Response Properties
- **TCP Congestion Control:** Switched system default TCP congestion control to Google BBR (`net.ipv4.tcp_congestion_control=bbr`) for faster packet delivery and lower network latency[span_32](start_span)[span_32](end_span)[span_33](start_span)[span_33](end_span)[span_34](start_span)[span_34](end_span).
- **Touch Calibration:** Injected geometric size calibration (`touch.size.calibration=geometric`) and pressure scaling (`touch.pressure.scale=0.001`) for instantaneous touch response[span_35](start_span)[span_35](end_span)[span_36](start_span)[span_36](end_span)[span_37](start_span)[span_37](end_span).

### 🧹 Reversibility & Clean Code
- **Uninstall Script Sync:** Updated `uninstall.sh` to fully revert all new Uclamp nodes, TCP parameters, and vendor audio/touch properties back to stock settings (`resetprop -z`)[span_38](start_span)[span_38](end_span)[span_39](start_span)[span_39](end_span).

---

## [vFinal] - 2026-09-23

### ⚡ Project Rebrand & Target
- **Official Rebrand:** Rebranded project identity to **Kunzite CoreFlow**[span_40](start_span)[span_40](end_span).
- **Hardware Target:** Specifically tuned for **Redmi Note 15 5G (SM6475)** running Snapdragon 6 Gen 3 SoC[span_41](start_span)[span_41](end_span)[span_42](start_span)[span_42](end_span)[span_43](start_span)[span_43](end_span).
