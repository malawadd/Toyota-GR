import { describe, it, expect } from 'vitest';
import { parseSections } from '../parsers/section-parser.js';
import { analyzeSections } from '../analyzers/section-analyzer.js';

describe('Section Integration Test', () => {
  it('should parse and analyze real section data', async () => {
    const sectionRecords = await parseSections('23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV');
    
    expect(sectionRecords.length).toBeGreaterThan(0);
    
    const result = analyzeSections(sectionRecords);
    
    // Verify all sections have fastest times
    expect(result.fastestBySection.get('S1')).not.toBeNull();
    expect(result.fastestBySection.get('S2')).not.toBeNull();
    expect(result.fastestBySection.get('S3')).not.toBeNull();
    
    // Verify all sections have average times
    expect(result.avgBySection.get('S1')).not.toBeNull();
    expect(result.avgBySection.get('S2')).not.toBeNull();
    expect(result.avgBySection.get('S3')).not.toBeNull();
    
    // Verify fastest vehicle is identified for each section
    expect(result.fastestVehicleBySection.get('S1').vehicle).not.toBeNull();
    expect(result.fastestVehicleBySection.get('S2').vehicle).not.toBeNull();
    expect(result.fastestVehicleBySection.get('S3').vehicle).not.toBeNull();
    
    // Verify fastest times are less than average times
    expect(result.fastestBySection.get('S1')).toBeLessThan(result.avgBySection.get('S1'));
    expect(result.fastestBySection.get('S2')).toBeLessThan(result.avgBySection.get('S2'));
    expect(result.fastestBySection.get('S3')).toBeLessThan(result.avgBySection.get('S3'));
    
    console.log('Section Analysis Results:');
    console.log(`  S1 Fastest: ${(result.fastestBySection.get('S1') / 1000).toFixed(3)}s (Vehicle ${result.fastestVehicleBySection.get('S1').vehicle})`);
    console.log(`  S1 Average: ${(result.avgBySection.get('S1') / 1000).toFixed(3)}s`);
    console.log(`  S2 Fastest: ${(result.fastestBySection.get('S2') / 1000).toFixed(3)}s (Vehicle ${result.fastestVehicleBySection.get('S2').vehicle})`);
    console.log(`  S2 Average: ${(result.avgBySection.get('S2') / 1000).toFixed(3)}s`);
    console.log(`  S3 Fastest: ${(result.fastestBySection.get('S3') / 1000).toFixed(3)}s (Vehicle ${result.fastestVehicleBySection.get('S3').vehicle})`);
    console.log(`  S3 Average: ${(result.avgBySection.get('S3') / 1000).toFixed(3)}s`);
  });
});
