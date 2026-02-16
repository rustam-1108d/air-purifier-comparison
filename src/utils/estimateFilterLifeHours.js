import calculateIndoorParticulateConcentration from "./calculateIndoorParticulateConcentration.js";

const estimateFilterLifeHours = ({
  cadrStart_m3ph,
  ccm_mg,
  minCadr_m3ph,

  roomVolume_m3,
  ventilation_m3ph,
  outdoorPm10_ugm3,
  penetrationFactor,

  indoorPm10Gen_ugph,
  deposition_per_h,

  maxHours,
  stopAtCcm = true
}) => {
  const vals = [
    cadrStart_m3ph, ccm_mg, minCadr_m3ph,
    roomVolume_m3, ventilation_m3ph, outdoorPm10_ugm3, penetrationFactor,
    indoorPm10Gen_ugph, deposition_per_h, maxHours
  ];
  if (!vals.every(Number.isFinite)) throw new Error("All parameters must be finite numbers.");
  if (roomVolume_m3 <= 0) throw new Error("roomVolume_m3 must be > 0");
  if (cadrStart_m3ph <= 0) throw new Error("cadrStart_m3ph must be > 0");
  if (ccm_mg <= 0) throw new Error("ccm_mg must be > 0");
  if (minCadr_m3ph < 0) throw new Error("minCadr_m3ph must be >= 0");
  if (penetrationFactor < 0 || penetrationFactor > 1) throw new Error("penetrationFactor must be in [0,1]");
  if (maxHours < 0) throw new Error("maxHours must be >= 0");

  let Mt_mg = 0; // total captured mass (mg)

  const cadrFromMt = (mt_mg) => Math.max(0, cadrStart_m3ph * (1 - 0.5 * (mt_mg / ccm_mg)));

  for (let h = 0; h <= maxHours; h++) {
    const cadr_t = cadrFromMt(Mt_mg);

    if (cadr_t <= minCadr_m3ph || (stopAtCcm && Mt_mg >= ccm_mg)) return h;

    const cInside_ugm3 = calculateIndoorParticulateConcentration({
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

  return Infinity;
};

export default estimateFilterLifeHours;
