Auto Recenter Plugin – Release V1.0
Purpose (short)

Automatically recenters the SDR LO (center frequency) when the user reaches the tuning limits of the current profile window, allowing continuous tuning across a wide frequency range using a single profile.

This works by detecting UI clamping and forcing a backend setfrequency command, without fighting the OpenWebRX+ UI.


Auto Recenter Plugin for OpenWebRX+
Overview

This plugin allows continuous tuning across large frequency ranges using a single OpenWebRX+ profile, even when the UI normally clamps tuning at the profile edges.

When the user reaches the tuning limit, the plugin automatically moves the SDR center frequency (LO) so tuning can continue seamlessly.

Key Features

Automatic LO recentering when UI tuning is clamped

Works with mouse drag, tuning buttons, and manual frequency entry

No UI flicker or infinite loops

No backend modification required

Compatible with RTL-SDR, Airspy, PlutoSDR, RSPdx

Designed for single-user LAN setups

How It Works

OpenWebRX+ clamps tuning when reaching profile limits

The plugin detects this clamp in the UI

The plugin sends a setfrequency command to the backend

The SDR LO is moved to the clamped frequency

The UI naturally updates and tuning continues

The plugin never forces UI retuning, which avoids conflicts with OpenWebRX+ internal logic.

Installation

Create the plugin directory:

plugins/receiver/auto_recenter/


Copy auto_recenter.js into that directory

Enable the plugin in:

plugins/receiver/init.js

Plugins.load("auto_recenter");


Restart OpenWebRX+

Hard-reload the browser (Ctrl+Shift+F5)

Usage

Drag the VFO to the edge of the waterfall → automatic recenter

Enter a frequency (e.g. 442.45, 433.92M) and press Enter

Tuning continues without changing profiles

Limitations

The backend still enforces hardware and profile constraints

Very high sample rates may cause frequent recentering

Designed for single-user operation (not multi-user safe)

Recommended Use Case

One wide-range SDR

Moderate bandwidth (e.g. 1–3 MS/s)

Minimal profile switching

Exploration / monitoring across bands

Future Enhancements (planned)

Enable/disable toggle in UI

Center quantization (e.g. 500 kHz / 1 MHz steps)

Visual indicator of real LO center

Optional SigMF I/Q recording hook

🧾 Status

Release: 1.0
Stability: Proven on OpenWebRX+ 1.2.102
Backend changes: None
Maintenance: Low
