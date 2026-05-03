def compute_confidence(inferences, signals, root_severity):
    # Determine base confidence strictly from ranges matching the prompt
    # ranges: strong multi-signal agreement: 0.8-0.9, moderate: 0.6-0.75, weak: 0.4-0.6
    agreement_score = len(inferences)
    alerts_present = signals.get("alerts_present", False)
    flags_aligned = signals.get("flags_aligned", False)

    strength = 0
    if agreement_score >= 2:
        strength += 2
    elif agreement_score == 1:
        strength += 1
    
    if alerts_present:
        strength += 1
    if flags_aligned:
        strength += 1

    if strength >= 3:
        # Strong
        base = 0.8 + (min(agreement_score, 3) * 0.03)
    elif strength == 2:
        # Moderate
        base = 0.6 + (min(agreement_score, 2) * 0.05)
    else:
        # Weak
        base = 0.4 + (strength * 0.05)

    if root_severity == "CRITICAL":
        base += 0.05
    elif root_severity == "MEDIUM":
        base -= 0.05

    return max(0.4, min(base, 0.9))
