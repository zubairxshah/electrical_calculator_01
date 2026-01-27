/**
 * Utility functions for converting between different units used in electrical calculations
 */

/**
 * Convert voltage units
 */
export class VoltageConverter {
  /**
   * Convert voltage from kV to V
   * @param kvolts Voltage in kilovolts
   * @returns Voltage in volts
   */
  static kVtoV(kvolts: number): number {
    return kvolts * 1000;
  }

  /**
   * Convert voltage from V to kV
   * @param volts Voltage in volts
   * @returns Voltage in kilovolts
   */
  static VtokV(volts: number): number {
    return volts / 1000;
  }

  /**
   * Convert voltage from V to mV
   * @param volts Voltage in volts
   * @returns Voltage in millivolts
   */
  static VtomV(volts: number): number {
    return volts * 1000;
  }

  /**
   * Convert voltage from mV to V
   * @param millivolts Voltage in millivolts
   * @returns Voltage in volts
   */
  static mVtoV(millivolts: number): number {
    return millivolts / 1000;
  }
}

/**
 * Convert current units
 */
export class CurrentConverter {
  /**
   * Convert current from A to mA
   * @param amps Current in amperes
   * @returns Current in milliamperes
   */
  static AtomA(amps: number): number {
    return amps * 1000;
  }

  /**
   * Convert current from mA to A
   * @param milliamps Current in milliamperes
   * @returns Current in amperes
   */
  static mAtoA(milliamps: number): number {
    return milliamps / 1000;
  }

  /**
   * Convert current from A to kA
   * @param amps Current in amperes
   * @returns Current in kiloamperes
   */
  static AtoKA(amps: number): number {
    return amps / 1000;
  }

  /**
   * Convert current from kA to A
   * @param kiloamps Current in kiloamperes
   * @returns Current in amperes
   */
  static KAtoA(kiloamps: number): number {
    return kiloamps * 1000;
  }
}

/**
 * Convert length units
 */
export class LengthConverter {
  /**
   * Convert length from meters to feet
   * @param meters Length in meters
   * @returns Length in feet
   */
  static mtoft(meters: number): number {
    return meters * 3.28084;
  }

  /**
   * Convert length from feet to meters
   * @param feet Length in feet
   * @returns Length in meters
   */
  static ftom(ft: number): number {
    return ft / 3.28084;
  }

  /**
   * Convert length from mm to inches
   * @param mm Length in millimeters
   * @returns Length in inches
   */
  static mmtoin(mm: number): number {
    return mm / 25.4;
  }

  /**
   * Convert length from inches to mm
   * @param inches Length in inches
   * @returns Length in millimeters
   */
  static intoMM(inches: number): number {
    return inches * 25.4;
  }

  /**
   * Convert length from meters to centimeters
   * @param meters Length in meters
   * @returns Length in centimeters
   */
  static mtocm(meters: number): number {
    return meters * 100;
  }

  /**
   * Convert length from cm to meters
   * @param cm Length in centimeters
   * @returns Length in meters
   */
  static cmtoM(cm: number): number {
    return cm / 100;
  }
}

/**
 * Convert temperature units
 */
export class TemperatureConverter {
  /**
   * Convert temperature from Celsius to Fahrenheit
   * @param celsius Temperature in Celsius
   * @returns Temperature in Fahrenheit
   */
  static CtoF(celsius: number): number {
    return (celsius * 9 / 5) + 32;
  }

  /**
   * Convert temperature from Fahrenheit to Celsius
   * @param fahrenheit Temperature in Fahrenheit
   * @returns Temperature in Celsius
   */
  static FtoC(fahrenheit: number): number {
    return (fahrenheit - 32) * 5 / 9;
  }

  /**
   * Convert temperature from Celsius to Kelvin
   * @param celsius Temperature in Celsius
   * @returns Temperature in Kelvin
   */
  static CtoK(celsius: number): number {
    return celsius + 273.15;
  }

  /**
   * Convert temperature from Kelvin to Celsius
   * @param kelvin Temperature in Kelvin
   * @returns Temperature in Celsius
   */
  static KtoC(kelvin: number): number {
    return kelvin - 273.15;
  }
}

/**
 * Convert power units
 */
export class PowerConverter {
  /**
   * Convert power from W to kW
   * @param watts Power in watts
   * @returns Power in kilowatts
   */
  static WtoKW(watts: number): number {
    return watts / 1000;
  }

  /**
   * Convert power from kW to W
   * @param kw Power in kilowatts
   * @returns Power in watts
   */
  static KWtoW(kw: number): number {
    return kw * 1000;
  }

  /**
   * Convert power from W to MW
   * @param watts Power in watts
   * @returns Power in megawatts
   */
  static WtoMW(watts: number): number {
    return watts / 1000000;
  }

  /**
   * Convert power from MW to W
   * @param mw Power in megawatts
   * @returns Power in watts
   */
  static MWtoW(mw: number): number {
    return mw * 1000000;
  }
}

/**
 * General unit converter utility
 */
export class UnitConverter {
  /**
   * Convert between various units based on unit types
   * @param value The value to convert
   * @param fromUnit The source unit
   * @param toUnit The target unit
   * @returns Converted value
   */
  static convert(value: number, fromUnit: string, toUnit: string): number {
    // Voltage conversions
    if (fromUnit === 'kV' && toUnit === 'V') return VoltageConverter.kVtoV(value);
    if (fromUnit === 'V' && toUnit === 'kV') return VoltageConverter.VtokV(value);
    if (fromUnit === 'V' && toUnit === 'mV') return VoltageConverter.VtomV(value);
    if (fromUnit === 'mV' && toUnit === 'V') return VoltageConverter.mVtoV(value);

    // Current conversions
    if (fromUnit === 'A' && toUnit === 'mA') return CurrentConverter.AtomA(value);
    if (fromUnit === 'mA' && toUnit === 'A') return CurrentConverter.mAtoA(value);
    if (fromUnit === 'A' && toUnit === 'kA') return CurrentConverter.AtoKA(value);
    if (fromUnit === 'kA' && toUnit === 'A') return CurrentConverter.KAtoA(value);

    // Length conversions
    if (fromUnit === 'm' && toUnit === 'ft') return LengthConverter.mtoft(value);
    if (fromUnit === 'ft' && toUnit === 'm') return LengthConverter.ftom(value);
    if (fromUnit === 'mm' && toUnit === 'in') return LengthConverter.mmtoin(value);
    if (fromUnit === 'in' && toUnit === 'mm') return LengthConverter.intoMM(value);
    if (fromUnit === 'm' && toUnit === 'cm') return LengthConverter.mtocm(value);
    if (fromUnit === 'cm' && toUnit === 'm') return LengthConverter.cmtoM(value);

    // Temperature conversions
    if (fromUnit === 'C' && toUnit === 'F') return TemperatureConverter.CtoF(value);
    if (fromUnit === 'F' && toUnit === 'C') return TemperatureConverter.FtoC(value);
    if (fromUnit === 'C' && toUnit === 'K') return TemperatureConverter.CtoK(value);
    if (fromUnit === 'K' && toUnit === 'C') return TemperatureConverter.KtoC(value);

    // Power conversions
    if (fromUnit === 'W' && toUnit === 'kW') return PowerConverter.WtoKW(value);
    if (fromUnit === 'kW' && toUnit === 'W') return PowerConverter.KWtoW(value);
    if (fromUnit === 'W' && toUnit === 'MW') return PowerConverter.WtoMW(value);
    if (fromUnit === 'MW' && toUnit === 'W') return PowerConverter.MWtoW(value);

    // If no conversion found, return the original value
    console.warn(`No conversion found for ${fromUnit} to ${toUnit}. Returning original value.`);
    return value;
  }

  /**
   * Format a value with its unit for display
   * @param value The value to format
   * @param unit The unit to append
   * @param decimals Number of decimal places to show (default: 2)
   * @returns Formatted string with value and unit
   */
  static formatWithUnit(value: number, unit: string, decimals: number = 2): string {
    return `${value.toFixed(decimals)} ${unit}`;
  }
}