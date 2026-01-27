import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalculatorForm from '../CalculatorForm';

// Mock the services and models
jest.mock('../../../services/lightning-arrester/calculationEngine', () => ({
  LightningArresterCalculationEngine: jest.fn().mockImplementation(() => ({
    calculate: jest.fn().mockReturnValue({
      arresterType: 'mov',
      rating: 12,
      complianceResults: [],
      installationRecommendation: 'Line side of service disconnect',
      warnings: [],
      calculationTimestamp: new Date(),
    })
  }))
}));

jest.mock('../../../services/lightning-arrester/validation', () => ({
  LightningArresterValidationService: jest.fn().mockImplementation(() => ({
    validate: jest.fn().mockReturnValue([]),
    getWarnings: jest.fn().mockReturnValue([])
  }))
}));

describe('CalculatorForm', () => {
  const mockOnCalculationComplete = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(
      <CalculatorForm
        onCalculationComplete={mockOnCalculationComplete}
        onError={mockOnError}
      />
    );

    // Check that all form fields are present
    expect(screen.getByLabelText(/System Voltage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Structure Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Humidity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pollution Level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Altitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Compliance Requirement/i)).toBeInTheDocument();

    // Check submit button
    expect(screen.getByRole('button', { name: /Calculate/i })).toBeInTheDocument();
  });

  it('allows user to input values', () => {
    render(
      <CalculatorForm
        onCalculationComplete={mockOnCalculationComplete}
        onError={mockOnError}
      />
    );

    // Input system voltage
    const voltageInput = screen.getByLabelText(/System Voltage/i);
    fireEvent.change(voltageInput, { target: { value: '11' } });
    expect(voltageInput).toHaveValue(11);

    // Select structure type
    const structureSelect = screen.getByLabelText(/Structure Type/i);
    fireEvent.change(structureSelect, { target: { value: 'home' } });
    expect(structureSelect).toHaveValue('home');

    // Input humidity
    const humidityInput = screen.getByLabelText(/Humidity/i);
    fireEvent.change(humidityInput, { target: { value: '65' } });
    expect(humidityInput).toHaveValue(65);

    // Select pollution level
    const pollutionSelect = screen.getByLabelText(/Pollution Level/i);
    fireEvent.change(pollutionSelect, { target: { value: 'medium' } });
    expect(pollutionSelect).toHaveValue('medium');

    // Input altitude
    const altitudeInput = screen.getByLabelText(/Altitude/i);
    fireEvent.change(altitudeInput, { target: { value: '150' } });
    expect(altitudeInput).toHaveValue(150);

    // Select compliance requirement
    const complianceSelect = screen.getByLabelText(/Compliance Requirement/i);
    fireEvent.change(complianceSelect, { target: { value: 'type1' } });
    expect(complianceSelect).toHaveValue('type1');
  });

  it('calls onCalculationComplete when form is submitted with valid data', async () => {
    render(
      <CalculatorForm
        onCalculationComplete={mockOnCalculationComplete}
        onError={mockOnError}
      />
    );

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/System Voltage/i), { target: { value: '11' } });
    fireEvent.change(screen.getByLabelText(/Structure Type/i), { target: { value: 'home' } });
    fireEvent.change(screen.getByLabelText(/Humidity/i), { target: { value: '65' } });
    fireEvent.change(screen.getByLabelText(/Pollution Level/i), { target: { value: 'medium' } });
    fireEvent.change(screen.getByLabelText(/Altitude/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Compliance Requirement/i), { target: { value: 'type1' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Calculate/i }));

    // Wait for the async calculation to complete
    await waitFor(() => {
      expect(mockOnCalculationComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state during calculation', async () => {
    render(
      <CalculatorForm
        onCalculationComplete={mockOnCalculationComplete}
        onError={mockOnError}
      />
    );

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/System Voltage/i), { target: { value: '11' } });
    fireEvent.change(screen.getByLabelText(/Structure Type/i), { target: { value: 'home' } });
    fireEvent.change(screen.getByLabelText(/Humidity/i), { target: { value: '65' } });
    fireEvent.change(screen.getByLabelText(/Pollution Level/i), { target: { value: 'medium' } });
    fireEvent.change(screen.getByLabelText(/Altitude/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Compliance Requirement/i), { target: { value: 'type1' } });

    // Click submit button
    fireEvent.click(screen.getByRole('button', { name: /Calculate/i }));

    // Check that the button shows loading state
    const submitButton = screen.getByRole('button', { name: /Calculating/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Wait for calculation to complete
    await waitFor(() => {
      expect(mockOnCalculationComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('handles errors during calculation', async () => {
    // Mock the calculation engine to throw an error
    const mockCalculate = jest.fn().mockImplementation(() => {
      throw new Error('Calculation failed');
    });

    jest.mock('../../../services/lightning-arrester/calculationEngine', () => ({
      LightningArresterCalculationEngine: jest.fn().mockImplementation(() => ({
        calculate: mockCalculate
      }))
    }));

    // Re-import to pick up the new mock
    const { default: CalculatorFormReimported } = await import('../CalculatorForm');

    render(
      <CalculatorFormReimported
        onCalculationComplete={mockOnCalculationComplete}
        onError={mockOnError}
      />
    );

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/System Voltage/i), { target: { value: '11' } });
    fireEvent.change(screen.getByLabelText(/Structure Type/i), { target: { value: 'home' } });
    fireEvent.change(screen.getByLabelText(/Humidity/i), { target: { value: '65' } });
    fireEvent.change(screen.getByLabelText(/Pollution Level/i), { target: { value: 'medium' } });
    fireEvent.change(screen.getByLabelText(/Altitude/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Compliance Requirement/i), { target: { value: 'type1' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Calculate/i }));

    // Wait for the error handling
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Calculation failed');
    });
  });

  it('validates form inputs using react-hook-form', async () => {
    render(
      <CalculatorForm
        onCalculationComplete={mockOnCalculationComplete}
        onError={mockOnError}
      />
    );

    // Submit the form without filling in required fields
    fireEvent.click(screen.getByRole('button', { name: /Calculate/i }));

    // Wait for validation errors to appear
    await waitFor(() => {
      // Check that validation errors appear for required fields
      const errorElements = screen.getAllByText(/required|must be/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });
});