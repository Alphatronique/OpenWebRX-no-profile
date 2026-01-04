Auto Recenter Plugin – Release V1.0
Purpose (short)

Automatically recenters the SDR LO (center frequency) when the user reaches the tuning limits of the current profile window, allowing continuous tuning across a wide frequency range using a single profile.

This works by detecting UI clamping and forcing a backend setfrequency command, without fighting the OpenWebRX+ UI.
