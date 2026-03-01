import calculateIndoorParticulateConcentration from "./calculateIndoorParticulateConcentration.js";

const estimateFilterLifeHours = ({
  cadrStart_m3ph,
  ccm_mg,
  minRequiredCadr_m3ph,

  ventilation_m3ph,
  penetrationFactor = 1,
  outdoorPm10_ugm3,

  indoorPm10Gen_ugph,

  deposition_per_h = 0,
  roomVolume_m3,

  maxHours = 10 * 365 * 24,
  stopAtCcm = true
}) => {
  const vals = [
    cadrStart_m3ph, ccm_mg, minRequiredCadr_m3ph,
    roomVolume_m3, ventilation_m3ph, outdoorPm10_ugm3, penetrationFactor,
    indoorPm10Gen_ugph, deposition_per_h, maxHours
  ];
  if (!vals.every(Number.isFinite)) throw new Error("All parameters must be finite numbers.");
  if (roomVolume_m3 <= 0) throw new Error("roomVolume_m3 must be > 0");
  if (cadrStart_m3ph <= 0) throw new Error("cadrStart_m3ph must be > 0");
  if (ccm_mg <= 0) throw new Error("ccm_mg must be > 0");
  if (minRequiredCadr_m3ph < 0) throw new Error("minRequiredCadr_m3ph must be >= 0");
  if (penetrationFactor < 0 || penetrationFactor > 1) throw new Error("penetrationFactor must be in [0,1]");
  if (maxHours < 0) throw new Error("maxHours must be >= 0");

  let Mt_mg = 0; // total captured mass (mg)
  let cInside_ugm3 = null;

  const cadrFromMt = (mt_mg) => Math.max(0, cadrStart_m3ph * (1 - 0.5 * (mt_mg / ccm_mg)));

  const buildResult = (hours, stopReason) => {
    const finalCadr_m3ph = cadrFromMt(Mt_mg);
    const reachedMinRequiredCadr = finalCadr_m3ph <= minRequiredCadr_m3ph;
    const reachedCcm = Mt_mg >= ccm_mg;

    return {
      hours,
      days: hours / 24,
      years: hours / (365 * 24),
      stopReason,
      reachedMinRequiredCadr,
      reachedCcm,
      finalCadr_m3ph,
      minRequiredCadr_m3ph,
      capturedMass_mg: Mt_mg,
      ccm_mg,
      capturedMassFractionOfCcm: Mt_mg / ccm_mg,
      lastEstimatedIndoorPm10_ugm3: cInside_ugm3,
    };
  };

  for (let h = 0; h < maxHours; h += 1) {
    const cadr_t = cadrFromMt(Mt_mg);

    if (cadr_t <= minRequiredCadr_m3ph) {
      return buildResult(h, "min_required_cadr_reached");
    }
    if (stopAtCcm && Mt_mg >= ccm_mg) {
      return buildResult(h, "ccm_reached");
    }

    cInside_ugm3 = calculateIndoorParticulateConcentration({
      ventilationRate: ventilation_m3ph,
      penetrationFactor,
      outdoorParticulateConcentration: outdoorPm10_ugm3,
      indoorParticulateGeneration: indoorPm10Gen_ugph,
      cadr: cadr_t,
      depositionRate: deposition_per_h,
      roomVolume: roomVolume_m3,
    });

    // captured this hour (mg)
    const capturedThisHour_mg = (cadr_t * cInside_ugm3) / 1000;

    Mt_mg += capturedThisHour_mg;
  }

  return buildResult(maxHours, "max_hours_reached");
};

export default estimateFilterLifeHours;
