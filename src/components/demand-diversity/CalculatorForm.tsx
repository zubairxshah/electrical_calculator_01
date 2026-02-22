'use client';

import React, { useState } from 'react';
import { DemandCalculationEngine } from '../../services/demand-diversity/calculationEngine';
import { DemandValidationService } from '../../services/demand-diversity/validation';
import { DemandCalculationParameters } from '../../models/DemandCalculationParameters';
import { DemandCalculationResult } from '../../models/DemandCalculationResult';

interface CalculatorFormProps {
  onCalculationComplete: (result: DemandCalculationResult) => void;
  onError: (error: string) => void;
}

const CalculatorForm: React.FC<CalculatorFormProps> = ({ onCalculationComplete, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<'residential' | 'commercial' | 'industrial'>('residential');
  const [standard, setStandard] = useState<'IEC' | 'NEC'>('IEC');
  const [voltage, setVoltage] = useState(230);
  const [phases, setPhases] = useState<1 | 3>(1);
  const [frequency, setFrequency] = useState<50 | 60>(50);
  
  // Load inputs
  const [loads, setLoads] = useState({
    lighting: '',
    socketOutlets: '',
    hvac: '',
    cookingAppliances: '',
    waterHeating: '',
    otherAppliances: '',
    generalLighting: '',
    receptacleLoads: '',
    elevators: '',
    kitchenEquipment: '',
    specialEquipment: '',
    motorLoads: [] as any[],
    processEquipment: '',
    weldingEquipment: '',
    controlSystems: '',
  });

  const validationService = new DemandValidationService();
  const calculationEngine = new DemandCalculationEngine();

  // Get visible load fields based on project type
  const getVisibleLoadFields = () => {
    switch (projectType) {
      case 'residential':
        return [
          { key: 'lighting', label: 'Lighting (kW)' },
          { key: 'socketOutlets', label: 'Socket Outlets (kW)' },
          { key: 'hvac', label: 'HVAC Systems (kW)' },
          { key: 'cookingAppliances', label: 'Cooking Appliances (kW)' },
          { key: 'waterHeating', label: 'Water Heating (kW)' },
          { key: 'otherAppliances', label: 'Other Appliances (kW)' },
        ];
      case 'commercial':
        return [
          { key: 'generalLighting', label: 'General Lighting (kW)' },
          { key: 'receptacleLoads', label: 'Receptacle Loads (kW)' },
          { key: 'hvac', label: 'HVAC Systems (kW)' },
          { key: 'elevators', label: 'Elevators/Escalators (kW)' },
          { key: 'kitchenEquipment', label: 'Kitchen Equipment (kW)' },
          { key: 'specialEquipment', label: 'Special Equipment (kW)' },
        ];
      case 'industrial':
        return [
          { key: 'motorLoads', label: 'Motor Loads (use motor table below)', type: 'special' },
          { key: 'processEquipment', label: 'Process Equipment (kW)' },
          { key: 'lighting', label: 'Lighting (kW)' },
          { key: 'hvac', label: 'HVAC/Ventilation (kW)' },
          { key: 'weldingEquipment', label: 'Welding Equipment (kVA)' },
          { key: 'controlSystems', label: 'Control Systems (kW)' },
        ];
      default:
        return [];
    }
  };

  // Handle load input change
  const handleLoadChange = (key: string, value: string) => {
    setLoads(prev => ({ ...prev, [key]: value }));
    
    // Update warnings in real-time
    const params: DemandCalculationParameters = {
      projectName,
      projectType,
      standard,
      voltage,
      phases,
      frequency,
      loads: {
        lighting: parseFloat(loads.lighting) || 0,
        socketOutlets: parseFloat(loads.socketOutlets) || 0,
        hvac: parseFloat(loads.hvac) || 0,
        cookingAppliances: parseFloat(loads.cookingAppliances) || 0,
        waterHeating: parseFloat(loads.waterHeating) || 0,
        otherAppliances: parseFloat(loads.otherAppliances) || 0,
        generalLighting: parseFloat(loads.generalLighting) || 0,
        receptacleLoads: parseFloat(loads.receptacleLoads) || 0,
        elevators: parseFloat(loads.elevators) || 0,
        kitchenEquipment: parseFloat(loads.kitchenEquipment) || 0,
        specialEquipment: parseFloat(loads.specialEquipment) || 0,
        motorLoads: loads.motorLoads,
        processEquipment: parseFloat(loads.processEquipment) || 0,
        weldingEquipment: parseFloat(loads.weldingEquipment) || 0,
        controlSystems: parseFloat(loads.controlSystems) || 0,
      },
    };
    
    const ws = validationService.getWarnings(params);
    setWarnings(ws);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Build loads object with parsed numbers
      const loadsObj: any = {};
      for (const [key, value] of Object.entries(loads)) {
        if (key === 'motorLoads') {
          loadsObj[key] = value;
        } else if (typeof value === 'string' && value !== '') {
          loadsObj[key] = parseFloat(value);
        }
      }

      const params: DemandCalculationParameters = {
        projectName: projectName || 'Untitled Project',
        projectType,
        standard,
        voltage,
        phases,
        frequency,
        loads: loadsObj,
      };

      // Validate
      const errors = validationService.validate(params);
      if (errors.length > 0) {
        onError(errors.join('\n'));
        setIsLoading(false);
        return;
      }

      // Calculate
      const result = calculationEngine.calculate(params);
      onCalculationComplete(result);
    } catch (error: any) {
      onError(error.message || 'An error occurred during calculation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setProjectName('');
    setProjectType('residential');
    setStandard('IEC');
    setVoltage(230);
    setPhases(1);
    setFrequency(50);
    setLoads({
      lighting: '',
      socketOutlets: '',
      hvac: '',
      cookingAppliances: '',
      waterHeating: '',
      otherAppliances: '',
      generalLighting: '',
      receptacleLoads: '',
      elevators: '',
      kitchenEquipment: '',
      specialEquipment: '',
      motorLoads: [],
      processEquipment: '',
      weldingEquipment: '',
      controlSystems: '',
    });
    setWarnings([]);
  };

  const loadFields = getVisibleLoadFields();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Smith Residence"
          />
        </div>

        <div>
          <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">
            Project Type
          </label>
          <select
            id="projectType"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>
      </div>

      {/* Standard Toggle */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700">Standard:</span>
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setStandard('IEC')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
              standard === 'IEC'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            IEC 60364
          </button>
          <button
            type="button"
            onClick={() => setStandard('NEC')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
              standard === 'NEC'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            NEC Article 220
          </button>
        </div>
      </div>

      {/* System Configuration */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="voltage" className="block text-sm font-medium text-gray-700 mb-1">
            Voltage (V)
          </label>
          <input
            id="voltage"
            type="number"
            value={voltage}
            onChange={(e) => setVoltage(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="phases" className="block text-sm font-medium text-gray-700 mb-1">
            Phases
          </label>
          <select
            id="phases"
            value={phases}
            onChange={(e) => setPhases(parseInt(e.target.value) as 1 | 3)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={1}>1 (Single)</option>
            <option value={3}>3 (Three)</option>
          </select>
        </div>

        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
            Frequency (Hz)
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(parseInt(e.target.value) as 50 | 60)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={50}>50</option>
            <option value={60}>60</option>
          </select>
        </div>
      </div>

      {/* Load Categories */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-md font-medium text-gray-900 mb-4">Load Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              {field.type === 'special' ? (
                <p className="text-sm text-gray-500 italic">Configure in motor table below</p>
              ) : (
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={loads[field.key as keyof typeof loads] as string}
                  onChange={(e) => handleLoadChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.0"
                />
              )}
            </div>
          ))}
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

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
            'Calculate Maximum Demand'
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default CalculatorForm;
