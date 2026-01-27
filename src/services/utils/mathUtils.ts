/**
 * Mathematical utility functions for electrical calculations
 */

/**
 * Basic mathematical utilities
 */
export class MathUtils {
  /**
   * Round a number to a specific number of decimal places
   * @param value The number to round
   * @param decimals Number of decimal places (default: 2)
   * @returns Rounded number
   */
  static round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Calculate the absolute difference between two numbers
   * @param a First number
   * @param b Second number
   * @returns Absolute difference
   */
  static absDiff(a: number, b: number): number {
    return Math.abs(a - b);
  }

  /**
   * Check if two numbers are approximately equal within a tolerance
   * @param a First number
   * @param b Second number
   * @param tolerance Tolerance for comparison (default: 0.001)
   * @returns True if numbers are approximately equal
   */
  static approxEqual(a: number, b: number, tolerance: number = 0.001): boolean {
    return Math.abs(a - b) < tolerance;
  }

  /**
   * Clamp a value between min and max bounds
   * @param value The value to clamp
   * @param min Minimum value
   * @param max Maximum value
   * @returns Clamped value
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Linear interpolation between two values
   * @param a Start value
   * @param b End value
   * @param t Interpolation factor (0-1)
   * @returns Interpolated value
   */
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * MathUtils.clamp(t, 0, 1);
  }

  /**
   * Map a value from one range to another
   * @param value Value to map
   * @param inMin Input range minimum
   * @param inMax Input range maximum
   * @param outMin Output range minimum
   * @param outMax Output range maximum
   * @returns Mapped value
   */
  static mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  /**
   * Calculate percentage of a value
   * @param part The part value
   * @param whole The whole value
   * @returns Percentage as a number
   */
  static percentage(part: number, whole: number): number {
    if (whole === 0) {
      throw new Error('Whole cannot be zero');
    }
    return (part / whole) * 100;
  }

  /**
   * Calculate the square of a number
   * @param value The number to square
   * @returns Square of the number
   */
  static square(value: number): number {
    return value * value;
  }

  /**
   * Calculate the square root of a number
   * @param value The number to take the square root of
   * @returns Square root of the number
   */
  static sqrt(value: number): number {
    if (value < 0) {
      throw new Error('Cannot take square root of negative number');
    }
    return Math.sqrt(value);
  }

  /**
   * Calculate the cube root of a number
   * @param value The number to take the cube root of
   * @returns Cube root of the number
   */
  static cbrt(value: number): number {
    return Math.cbrt(value);
  }

  /**
   * Calculate the hypotenuse of a right triangle (Pythagorean theorem)
   * @param a First side
   * @param b Second side
   * @returns Hypotenuse
   */
  static hypot(a: number, b: number): number {
    return Math.sqrt(a * a + b * b);
  }

  /**
   * Calculate the factorial of a number
   * @param n The number to calculate factorial for
   * @returns Factorial of the number
   */
  static factorial(n: number): number {
    if (n < 0 || !Number.isInteger(n)) {
      throw new Error('Factorial is only defined for non-negative integers');
    }

    if (n === 0 || n === 1) {
      return 1;
    }

    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Calculate the greatest common divisor (GCD) of two numbers
   * @param a First number
   * @param b Second number
   * @returns Greatest common divisor
   */
  static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }

    return a;
  }

  /**
   * Calculate the least common multiple (LCM) of two numbers
   * @param a First number
   * @param b Second number
   * @returns Least common multiple
   */
  static lcm(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a * b) / MathUtils.gcd(a, b);
  }
}

/**
 * Electrical-specific mathematical utilities
 */
export class ElectricalMathUtils extends MathUtils {
  /**
   * Calculate apparent power (VA) from voltage and current
   * @param voltage Voltage in volts
   * @param current Current in amperes
   * @returns Apparent power in volt-amperes
   */
  static apparentPower(voltage: number, current: number): number {
    return voltage * current;
  }

  /**
   * Calculate real power (W) from apparent power and power factor
   * @param apparentPower Apparent power in VA
   * @param powerFactor Power factor (0-1)
   * @returns Real power in watts
   */
  static realPower(apparentPower: number, powerFactor: number): number {
    return apparentPower * powerFactor;
  }

  /**
   * Calculate reactive power (VAR) from apparent and real power
   * @param apparentPower Apparent power in VA
   * @param realPower Real power in W
   * @returns Reactive power in VAR
   */
  static reactivePower(apparentPower: number, realPower: number): number {
    return Math.sqrt(Math.pow(apparentPower, 2) - Math.pow(realPower, 2));
  }

  /**
   * Calculate power factor from real and apparent power
   * @param realPower Real power in W
   * @param apparentPower Apparent power in VA
   * @returns Power factor (0-1)
   */
  static powerFactor(realPower: number, apparentPower: number): number {
    if (apparentPower === 0) {
      throw new Error('Apparent power cannot be zero');
    }
    return realPower / apparentPower;
  }

  /**
   * Calculate voltage drop in a circuit
   * @param current Current in amperes
   * @param resistance Resistance in ohms
   * @returns Voltage drop in volts
   */
  static voltageDrop(current: number, resistance: number): number {
    return current * resistance;
  }

  /**
   * Calculate impedance magnitude from resistance and reactance
   * @param resistance Resistance in ohms
   * @param reactance Reactance in ohms
   * @returns Impedance magnitude in ohms
   */
  static impedanceMagnitude(resistance: number, reactance: number): number {
    return Math.sqrt(Math.pow(resistance, 2) + Math.pow(reactance, 2));
  }

  /**
   * Calculate the temperature coefficient adjustment for resistors
   * @param baseResistance Base resistance at reference temperature
   * @param temperatureCoefficient Temperature coefficient (α)
   * @param temperatureChange Change in temperature from reference
   * @returns Adjusted resistance
   */
  static temperatureAdjustment(
    baseResistance: number,
    temperatureCoefficient: number,
    temperatureChange: number
  ): number {
    return baseResistance * (1 + temperatureCoefficient * temperatureChange);
  }

  /**
   * Calculate the time constant for RC circuit
   * @param resistance Resistance in ohms
   * @param capacitance Capacitance in farads
   * @returns Time constant in seconds
   */
  static rcTimeConstant(resistance: number, capacitance: number): number {
    return resistance * capacitance;
  }

  /**
   * Calculate the time constant for RL circuit
   * @param inductance Inductance in henries
   * @param resistance Resistance in ohms
   * @returns Time constant in seconds
   */
  static rlTimeConstant(inductance: number, resistance: number): number {
    return inductance / resistance;
  }
}