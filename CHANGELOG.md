# Changelog - Kunzite CoreFlow

## [vFinal] - Initial Public Release
- **Rebrand:** Transitioned project identity to Kunzite CoreFlow.
- **Target Device:** Fully tuned for Redmi Note 15 5G (SM6475 / Snapdragon 6 Gen 3).
- **I/O Tuning:** Optimized `nr_requests` to 128 and `read_ahead_kb` to 256KB for balanced UFS throughput.
- **Overhead Reduction:** Disabled `iostats` and `add_random` across all block devices (`sda`–`sdf`) to minimize CPU wakeups.
- **VM Optimization:** Set `swappiness` to 60 and `vfs_cache_pressure` to 80 to eliminate UI micro-stutters and reduce zRAM overhead.
- **Flash Protection:** Refined `dirty_ratio` and `dirty_background_ratio` to protect UFS IC Flash longevity.
- **Installer:** Added clean terminal installation banner and execution logging at `/tmp/kernel_tuning.log`.
