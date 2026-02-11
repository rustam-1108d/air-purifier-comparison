import { useState, useEffect } from 'react'

import calculateRequiredParticulateCADR from './utils/calculateRequiredParticulateCADR';

import './App.css'

function App() {
  const [form, setForm] = useState({
    outdoorPm2_5Concentration: 0,
    outdoorPm10Concentration: 0,
    indoorPm2_5ConcentrationLimit: 5,
    indoorPm10ConcentrationLimit: 15,
    ventilationRate: 0,
    indoorPm2_5GenerationRate: 0,
    indoorPm10GenerationRate: 0,
  });

  const requiredPm2_5CADR = calculateRequiredParticulateCADR({
    indoorParticulateConcentrationLimit: form.indoorPm2_5ConcentrationLimit,
    outdoorParticulateConcentration: form.outdoorPm2_5Concentration,
    ventilationRate: form.ventilationRate,
    indoorParticulateGenerationRate: form.indoorPm2_5GenerationRate,
  });

  const requiredPm10CADR = calculateRequiredParticulateCADR({
    indoorParticulateConcentrationLimit: form.indoorPm10ConcentrationLimit,
    outdoorParticulateConcentration: form.outdoorPm10Concentration,
    ventilationRate: form.ventilationRate,
    indoorParticulateGenerationRate: form.indoorPm10GenerationRate,
  });

  console.log(form);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters

    setForm((prev) => ({
      ...prev,
      [name]: numericValue === "" ? "" : Number(numericValue),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;

    // If the input is empty, set it to 0 on blur
    if (value === "") {
      setForm((prev) => ({
        ...prev,
        [name]: 0,
      }));
    }
  };

  return (
    <>
      <div>
        <label htmlFor="outdoorPm2_5Concentration">Outdoor PM2.5 Concentration</label>
        <input type="text" id="outdoorPm2_5Concentration" name="outdoorPm2_5Concentration" maxLength={4} inputMode="numeric" pattern="\d*" value={form.outdoorPm2_5Concentration} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="outdoorPm10Concentration">Outdoor PM10 Concentration</label>
        <input type="text" id="outdoorPm10Concentration" name="outdoorPm10Concentration" maxLength={4} inputMode="numeric" pattern="\d*" value={form.outdoorPm10Concentration} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm2_5ConcentrationLimit">Indoor PM2.5 Concentration Limit</label>
        <input type="text" id="indoorPm2_5ConcentrationLimit" name="indoorPm2_5ConcentrationLimit" maxLength={4} inputMode="numeric" pattern="\d*" value={form.indoorPm2_5ConcentrationLimit} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm10ConcentrationLimit">Indoor PM10 Concentration Limit</label>
        <input type="text" id="indoorPm10ConcentrationLimit" name="indoorPm10ConcentrationLimit" maxLength={4} inputMode="numeric" pattern="\d*" value={form.indoorPm10ConcentrationLimit} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="ventilationRate">Ventilation Rate</label>
        <input type="text" id="ventilationRate" name="ventilationRate" maxLength={4} inputMode="numeric" pattern="\d*" value={form.ventilationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm2_5GenerationRate">Indoor PM2.5 Generation Rate</label>
        <input type="text" id="indoorPm2_5GenerationRate" name="indoorPm2_5GenerationRate" maxLength={4} inputMode="numeric" pattern="\d*" value={form.indoorPm2_5GenerationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>
      <div>
        <label htmlFor="indoorPm10GenerationRate">Indoor PM10 Generation Rate</label>
        <input type="text" id="indoorPm10GenerationRate" name="indoorPm10GenerationRate" maxLength={4} inputMode="numeric" pattern="\d*" value={form.indoorPm10GenerationRate} onChange={handleChange} onBlur={handleBlur} />
      </div>

      <div>
        <p>Required CADR for PM2.5: {requiredPm2_5CADR.toFixed(2)} m³/h</p>
        <p>Required CADR for PM10: {requiredPm10CADR.toFixed(2)} m³/h</p>
      </div>
    </>
  )
}

export default App
