import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LightningArresterCalculationEngine } from '../../services/lightning-arrester/calculationEngine';
import { LightningArresterValidationService } from '../../services/lightning-arrester/validation';
import { CalculationParameters } from '../../models/CalculationParameters';
import { VALIDATION_RULES } from '../../models/CalculationParameters';

// Define Zod schema for form validation
const calculationSchema = z.object({
  systemVoltage: z.number()
    .min(VALIDATION_RULES.MIN_VOLTAGE, `Must be at least ${VALIDATION_RULES.MIN_VOLTAGE} kV`)
    .max(VALIDATION_RULES.MAX_VOLTAGE, `Must be at most ${VALIDATION_RULES.MAX_VOLTAGE} kV`),
  structureType: z.enum(VALIDATION_RULES.STRUCTURE_TYPES),
  buildingHeight: z.number().optional().or(z.literal(0)),
  environmentalConditions: z.object({
    humidity: z.number()
      .min(VALIDATION_RULES.MIN_HUMIDITY, `Must be at least ${VALIDATION_RULES.MIN_HUMIDITY}%`)
      .max(VALIDATION_RULES.MAX_HUMIDITY, `Must be at most ${VALIDATION_RULES.MAX_HUMIDITY}%`),
    pollutionLevel: z.enum(['light', 'medium', 'heavy']),
    altitude: z.number()
      .min(VALIDATION_RULES.MIN_ALTITUDE, `Must be at least ${VALIDATION_RULES.MIN_ALTITUDE}m`)
      .max(VALIDATION_RULES.MAX_ALTITUDE, `Must be at most ${VALIDATION_RULES.MAX_ALTITUDE}m`),
  }),
  complianceRequirement: z.enum(VALIDATION_RULES.COMPLIANCE_REQUIREMENTS),
});

type FormData = z.infer<typeof calculationSchema>;

interface CalculatorFormProps {
  onCalculationComplete: (result: any) => void;
  onError: (error: string) => void;
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculationComplete, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const validationService = new LightningArresterValidationService();
  const calculationEngine = new LightningArresterCalculationEngine();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger
  } = useForm<FormData>({
    resolver: zodResolver(calculationSchema),
    mode: 'onChange', // Validate on change for real-time feedback
  });

  // Watch for changes to trigger real-time validation warnings
  const watchedFields = watch();

  // Trigger real-time validation for warnings
  React.useEffect(() => {
    const params: CalculationParameters = {
      systemVoltage: watchedFields.systemVoltage || 0,
      structureType: watchedFields.structureType || 'home',
      environmentalConditions: {
        humidity: watchedFields.environmentalConditions?.humidity || 50,
        pollutionLevel: watchedFields.environmentalConditions?.pollutionLevel || 'medium',
        altitude: watchedFields.environmentalConditions?.altitude || 0,
      },
      complianceRequirement: watchedFields.complianceRequirement || 'type1',
    };

    // Get warnings for unusual values
    const warningMessages = validationService.getWarnings(params);
    setWarnings(warningMessages);
  }, [watchedFields]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      // Convert form data to calculation parameters
      const params: CalculationParameters = {
        systemVoltage: data.systemVoltage,
        structureType: data.structureType,
        buildingHeight: data.buildingHeight || undefined,
        environmentalConditions: {
          humidity: data.environmentalConditions.humidity,
          pollutionLevel: data.environmentalConditions.pollutionLevel,
          altitude: data.environmentalConditions.altitude,
        },
        complianceRequirement: data.complianceRequirement,
      };

      // Perform the calculation
      const result = calculationEngine.calculate(params);

      // Call the callback with the result
      onCalculationComplete(result);
    } catch (error: any) {
      // Handle any errors during calculation
      onError(error.message || 'An error occurred during calculation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Voltage */}
        <div>
          <label htmlFor="systemVoltage" className="block text-sm font-medium text-gray-700 mb-1">
            System Voltage (kV)
          </label>
          <input
            id="systemVoltage"
            type="number"
            step="0.1"
            {...register('systemVoltage', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.systemVoltage ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter system voltage in kV"
          />
          {errors.systemVoltage && (
            <p className="mt-1 text-sm text-red-600">{errors.systemVoltage.message}</p>
          )}
        </div>

        {/* Structure Type */}
        <div>
          <label htmlFor="structureType" className="block text-sm font-medium text-gray-700 mb-1">
            Structure Type
          </label>
          <select
            id="structureType"
            {...register('structureType')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.structureType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select structure type</option>
            <option value="home">Home</option>
            <option value="tower">Tower</option>
            <option value="industry">Industry</option>
            <option value="traction">Traction System</option>
            <option value="highrise">High-Rise Building</option>
          </select>
          {errors.structureType && (
            <p className="mt-1 text-sm text-red-600">{errors.structureType.message}</p>
          )}
        </div>

        {/* Building Height (only for high-rise) */}
        {watchedFields.structureType === 'highrise' && (
          <div>
            <label htmlFor="buildingHeight" className="block text-sm font-medium text-gray-700 mb-1">
              Building Height (m)
            </label>
            <input
              id="buildingHeight"
              type="number"
              step="0.1"
              {...register('buildingHeight', { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.buildingHeight ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Height in meters (e.g., 30)"
            />
            {errors.buildingHeight && (
              <p className="mt-1 text-sm text-red-600">{errors.buildingHeight.message}</p>
            )}
            {watchedFields.buildingHeight && watchedFields.buildingHeight > 23 && (
              <p className="mt-1 text-xs text-gray-500">
                High-rise classification: &gt;23m (75 ft) per IEC 62305
              </p>
            )}
          </div>
        )}

        {/* Humidity */}
        <div>
          <label htmlFor="humidity" className="block text-sm font-medium text-gray-700 mb-1">
            Humidity (%)
          </label>
          <input
            id="humidity"
            type="number"
            step="1"
            {...register('environmentalConditions.humidity', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.environmentalConditions?.humidity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0-100%"
          />
          {errors.environmentalConditions?.humidity && (
            <p className="mt-1 text-sm text-red-600">{errors.environmentalConditions.humidity.message}</p>
          )}
        </div>

        {/* Pollution Level */}
        <div>
          <label htmlFor="pollutionLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Pollution Level
          </label>
          <select
            id="pollutionLevel"
            {...register('environmentalConditions.pollutionLevel')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.environmentalConditions?.pollutionLevel ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="light">Light</option>
            <option value="medium">Medium</option>
            <option value="heavy">Heavy</option>
          </select>
          {errors.environmentalConditions?.pollutionLevel && (
            <p className="mt-1 text-sm text-red-600">{errors.environmentalConditions.pollutionLevel.message}</p>
          )}
        </div>

        {/* Altitude */}
        <div>
          <label htmlFor="altitude" className="block text-sm font-medium text-gray-700 mb-1">
            Altitude (m)
          </label>
          <input
            id="altitude"
            type="number"
            step="1"
            {...register('environmentalConditions.altitude', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.environmentalConditions?.altitude ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Above sea level in meters"
          />
          {errors.environmentalConditions?.altitude && (
            <p className="mt-1 text-sm text-red-600">{errors.environmentalConditions.altitude.message}</p>
          )}
        </div>

        {/* Compliance Requirement */}
        <div>
          <label htmlFor="complianceRequirement" className="block text-sm font-medium text-gray-700 mb-1">
            Compliance Requirement
          </label>
          <select
            id="complianceRequirement"
            {...register('complianceRequirement')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.complianceRequirement ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="type1">Type 1 (Line Side)</option>
            <option value="type2">Type 2 (Load Side)</option>
          </select>
          {errors.complianceRequirement && (
            <p className="mt-1 text-sm text-red-600">{errors.complianceRequirement.message}</p>
          )}
        </div>
      </div>

      {/* Real-time warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">Warnings:</span>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating...
            </>
          ) : (
            'Calculate Recommended Arrester'
          )}
        </button>
      </div>
    </form>
  );
};

export default CalculatorForm;