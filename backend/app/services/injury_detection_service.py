import random
import uuid
from datetime import datetime
from typing import List, Optional

from app.schemas.injury_schemas import (
    BodyRegion,
    DetectedInjury,
    InjuryScanResponse,
    SeverityLevel,
)

#demo
INJURY_CATALOGUE = [
    dict(
        region=BodyRegion.LEFT_SHOULDER,
        possible_injury="Possible rotator cuff strain",
        severity=SeverityLevel.HIGH,
        recommended_action="Consult orthopedic specialist",
    ),
    dict(
        region=BodyRegion.LEFT_FOREARM,
        possible_injury="Possible radius fracture",
        severity=SeverityLevel.MEDIUM,
        recommended_action="X-ray recommended",
    ),
    dict(
        region=BodyRegion.LEFT_KNEE,
        possible_injury="Possible ligament (ACL/MCL) strain",
        severity=SeverityLevel.HIGH,
        recommended_action="MRI scan recommended",
    ),
    dict(
        region=BodyRegion.RIGHT_ANKLE,
        possible_injury="Possible mild sprain",
        severity=SeverityLevel.LOW,
        recommended_action="Rest & immobilisation advised",
    ),
    dict(
        region=BodyRegion.LOWER_BACK,
        possible_injury="Possible soft-tissue strain",
        severity=SeverityLevel.MEDIUM,
        recommended_action="Physiotherapy assessment recommended",
    ),
]


def _run_mock_vision_model(region_hint: Optional[BodyRegion], seed: Optional[str] = None) -> List[DetectedInjury]:
    """Simulates a vision model flagging 1-3 regions with confidence scores."""
    rng = random.Random(seed)
    candidates = INJURY_CATALOGUE.copy()

    if region_hint is not None:
        # Bias so the hinted region always appears first
        hinted = [c for c in candidates if c["region"] == region_hint]
        others = [c for c in candidates if c["region"] != region_hint]
        rng.shuffle(others)
        ordered = hinted + others
    else:
        ordered = candidates.copy()
        rng.shuffle(ordered)

    num_findings = rng.randint(1, 3)
    chosen = ordered[:num_findings]

    findings = []
    for entry in chosen:
        confidence = round(rng.uniform(0.62, 0.98), 3)
        findings.append(
            DetectedInjury(
                region=entry["region"],
                possible_injury=entry["possible_injury"],
                confidence=confidence,
                severity=entry["severity"],
                recommended_action=entry["recommended_action"],
            )
        )

    # Highest-confidence finding first
    findings.sort(key=lambda f: f.confidence, reverse=True)
    return findings


def run_demo_scan(
    patient_ref: Optional[str] = None, region_hint: Optional[BodyRegion] = None
) -> InjuryScanResponse:
    scan_id = str(uuid.uuid4())
    findings = _run_mock_vision_model(region_hint, seed=scan_id)

    return InjuryScanResponse(
        scan_id=scan_id,
        patient_ref=patient_ref,
        scanned_at=datetime.utcnow(),
        scan_status="COMPLETE",
        areas_of_concern=len(findings),
        findings=findings,
    )