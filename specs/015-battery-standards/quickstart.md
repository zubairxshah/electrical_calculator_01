# Quickstart / Manual Walkthrough: Battery Standards Hardening (015)

Run `npm run dev` and open `http://localhost:3000/battery`.

1. **Fresh defaults**: clear the `electromate-battery` localStorage key and reload → application "Standby / float", load type "AC via inverter", design margin 1.10.
2. **Standby sizing**: sizing mode, 48 V, 2000 W, 2 h, VRLA-AGM, 25 °C → the DoD factor shows 100 % (full discharge to end voltage), the applied factors list design margin 1.10, aging 0.80, efficiency 0.95. Required Ah ≈ 2000×2/(48×0.95)×1.10/0.80 ≈ 121 Ah.
3. **Cycling**: switch to Cycling → DoD 50 % appears and the required Ah roughly doubles.
4. **Voltage window**: enter min 42 V, max 56 V, VRLA → 24 cells (42/1.75), float 54.5 V, end 42 V; set max 52 V → voltage-window warning.
5. **Temperature**: set 10 °C on VRLA → temperature shows TCF 1.19; set −10 °C → clamp warning.
6. **Charger**: recharge 8 h, standing 5 A → required A and the recommended standard rating appear.
7. **Ventilation**: VRLA → Q float/boost in m³/h; enter room 30 m³ → ACH appears; switch to LFP → "not applicable".
8. **Code checks**: 120 V bank → NEC 480.7 disconnect note; LFP with > 20 kWh → NFPA 855 warning.
9. **Migration**: put a v1 payload in localStorage (`{"state":{"inputs":{"voltage":48,"mode":"sizing","efficiency":0.85,"chemistry":"VRLA-AGM","loadWatts":2000,"targetBackupHours":2}},"version":1}`) and reload → inputs kept, application standby, efficiency shows the 0.95 default.
10. **Reference guide**: open it from the header; Esc closes it and focus returns to the button.
11. **Keyboard only**: tab through all inputs; every control has a visible focus ring.
12. **PDF**: export → contains application mode, all factors, voltage window, charger, ventilation and installation checks.
