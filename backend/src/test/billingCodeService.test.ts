import { billingCodeService } from '../services/billingCodeService';

describe('BillingCodeService', () => {
  beforeAll(async () => {
    await billingCodeService.initialize();
  });

  test('should load billing codes from CSV', () => {
    const allCodes = billingCodeService.getAllCodes();
    expect(allCodes.length).toBeGreaterThan(0);
    
    // Check for specific codes we know should exist
    const h101Code = billingCodeService.getCodeByCode('H101');
    expect(h101Code).toBeDefined();
    expect(h101Code?.description).toContain('Minor assessment');
    expect(h101Code?.amount).toBe(15.00);
  });

  test('should search codes by query', async () => {
    const results = await billingCodeService.searchCodes('assessment');
    expect(results.length).toBeGreaterThan(0);
    
    // Should include assessment codes
    const hasAssessmentCodes = results.some(code => 
      code.description.toLowerCase().includes('assessment')
    );
    expect(hasAssessmentCodes).toBe(true);
  });

  test('should filter codes by category', async () => {
    const emergencyCodes = await billingCodeService.searchCodes('', {
      category: 'Emergency'
    });
    
    expect(emergencyCodes.length).toBeGreaterThan(0);
    expect(emergencyCodes.every(code => code.category === 'Emergency')).toBe(true);
  });

  test('should find optimal codes for clinical text', async () => {
    const clinicalText = 'Patient presents with chest pain, shortness of breath. Emergency assessment performed.';
    const optimizations = await billingCodeService.findOptimalCodes(clinicalText);
    
    expect(optimizations.length).toBeGreaterThan(0);
    expect(optimizations[0]).toHaveProperty('suggestedCode');
    expect(optimizations[0]).toHaveProperty('revenueImpact');
    expect(optimizations[0]).toHaveProperty('confidence');
  });

  test('should categorize codes correctly', () => {
    const allCodes = billingCodeService.getAllCodes();
    const categories = new Set(allCodes.map(code => code.category));
    
    expect(categories.has('Assessment')).toBe(true);
    expect(categories.has('Emergency')).toBe(true);
    expect(categories.has('Procedure')).toBe(true);
  });

  test('should extract time of day correctly', () => {
    const allCodes = billingCodeService.getAllCodes();
    const timeBasedCodes = allCodes.filter(code => code.timeOfDay);
    
    expect(timeBasedCodes.length).toBeGreaterThan(0);
    
    const timeOfDays = new Set(timeBasedCodes.map(code => code.timeOfDay));
    expect(timeOfDays.has('Day')).toBe(true);
    expect(timeOfDays.has('Evening')).toBe(true);
    expect(timeOfDays.has('Night')).toBe(true);
  });
});
