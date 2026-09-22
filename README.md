# Kunzite CoreFlow (vFinal)

**Kunzite CoreFlow** is a low-level system tuning module engineered specifically for the **Redmi Note 15 5G (SM6475)** powered by the Snapdragon 6 Gen 3 processor.

Unlike conventional performance-centric tweaks that force CPU/GPU clocks into aggressive states, **Kunzite CoreFlow** focuses on **system efficiency, UI responsiveness, I/O storage stability, and long-term hardware longevity**.

---

## ⚡ Core Features & Optimization Focus

- **Smart I/O Queue Management:** Balances UFS storage throughput to prevent queue bottlenecks without overtaxing memory controllers.
- **CPU Overhead Reduction:** Disables unnecessary background I/O tracing and statistics to allow CPU cores to enter deep sleep states faster and remain cooler.
- **Memory & Latency Harmony:** Fine-tunes cache pressure and dirty memory writeback intervals to eliminate micro-stutters during heavy multitasking without triggering excessive RAM compression.
- **Hardware Longevity:** Reduces thermal spikes and prevents aggressive write cycles on the UFS IC Flash memory to extend the hardware lifespan of your device.

---

## 📊 Tuning Parameters Overview

| Sector | Parameter | Stock Value | Kunzite CoreFlow | Benefit / Impact |
| :--- | :--- | :--- | :--- | :--- |
| **I/O Queue** | `nr_requests` | `62` | `128` | Smooths out data request queues without straining system RAM |
| **I/O Overhead** | `iostats` | `1` | `0` | Eliminates wasted CPU cycles caused by constant I/O logging |
| **Read-Ahead** | `read_ahead_kb` | `512` KB | `256` KB | Accelerates random read operations for faster UI/App launches |
| **Virtual Memory** | `swappiness` | `120` | `60` | Prevents CPU overwork caused by continuous zRAM compression |
| **VM Cache** | `vfs_cache_pressure` | `80` | Retains directory caches longer for instant app re-openings |
| **Flash Longevity** | `dirty_ratio` | `20` | `15` | Prevents massive bulk write spikes to prolong UFS flash life |

---

## 🚀 Installation

1. Download the latest release `.zip` package from this repository.
2. Open your preferred root manager (**KernelSU-Next** / **APatch** / **Magisk**).
3. Navigate to **Modules** > **Install from storage**.
4. Select the module zip file and wait for the installation process to complete.
5. Reboot your device.

> **Note:** Execution logs are generated automatically after a full system boot and saved to `/tmp/kernel_tuning.log`.

---

## 📜 License & Credit

- **Author:** [mystivara-creator](https://github.com/mystivara-creator)
- **Target Device:** Redmi Note 15 5G (`kunzite`) / Snapdragon 6 Gen 3 (SM6475)
- **License:** MIT License
