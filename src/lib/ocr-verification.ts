import Tesseract from 'tesseract.js';

/**
 * OCR Document Verification Utility
 * Extracts text from uploaded documents and verifies information
 */

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  extractedData?: {
    licenseNumber?: string;
    tinNumber?: string;
    documentNumber?: string;
    names?: string[];
    dates?: string[];
  };
  error?: string;
}

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(imageUrl: string): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: (m) => {
          // Log progress for debugging
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${(m.progress * 100).toFixed(2)}%`);
          }
        },
      }
    );

    return {
      success: true,
      text: result.data.text,
      confidence: result.data.confidence,
      extractedData: extractStructuredData(result.data.text),
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract structured data from OCR text
 */
function extractStructuredData(text: string): OCRResult['extractedData'] {
  const data: OCRResult['extractedData'] = {
    names: [],
    dates: [],
  };

  // Extract license number (Ethiopian format: starts with letters followed by numbers)
  const licenseMatch = text.match(/[A-Z]{2,4}[\s-]?\d{5,10}/i);
  if (licenseMatch) {
    data.licenseNumber = licenseMatch[0];
  }

  // Extract TIN number (Ethiopian TIN: 10 digits)
  const tinMatch = text.match(/\b\d{10}\b/);
  if (tinMatch) {
    data.tinNumber = tinMatch[0];
  }

  // Extract document number (generic)
  const docMatch = text.match(/(?:Doc|Document|No|Number)[\s:.-]+([A-Z0-9-]+)/i);
  if (docMatch) {
    data.documentNumber = docMatch[1];
  }

  // Extract names (capitalized words that could be names)
  const nameMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
  if (nameMatches) {
    data.names = nameMatches.slice(0, 5); // Limit to first 5 potential names
  }

  // Extract dates (various formats)
  const dateMatches = text.match(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b/g);
  if (dateMatches) {
    data.dates = dateMatches;
  }

  return data;
}

/**
 * Verify trade license document
 */
export async function verifyTradeLicense(imageUrl: string, expectedLicenseNumber?: string): Promise<{
  verified: boolean;
  ocrResult: OCRResult;
  matchesExpected: boolean;
}> {
  const ocrResult = await extractTextFromImage(imageUrl);

  let matchesExpected = false;
  if (expectedLicenseNumber && ocrResult.extractedData?.licenseNumber) {
    // Normalize both strings for comparison
    const extracted = ocrResult.extractedData.licenseNumber.replace(/[\s-]/g, '').toUpperCase();
    const expected = expectedLicenseNumber.replace(/[\s-]/g, '').toUpperCase();
    matchesExpected = extracted.includes(expected) || expected.includes(extracted);
  }

  const verified = ocrResult.success && ocrResult.confidence > 60 && (
    !expectedLicenseNumber || matchesExpected
  );

  return {
    verified,
    ocrResult,
    matchesExpected,
  };
}

/**
 * Verify TIN certificate
 */
export async function verifyTINCertificate(imageUrl: string, expectedTIN?: string): Promise<{
  verified: boolean;
  ocrResult: OCRResult;
  matchesExpected: boolean;
}> {
  const ocrResult = await extractTextFromImage(imageUrl);

  let matchesExpected = false;
  if (expectedTIN && ocrResult.extractedData?.tinNumber) {
    matchesExpected = ocrResult.extractedData.tinNumber === expectedTIN;
  }

  const verified = ocrResult.success && ocrResult.confidence > 60 && (
    !expectedTIN || matchesExpected
  );

  return {
    verified,
    ocrResult,
    matchesExpected,
  };
}

/**
 * Verify business registration document
 */
export async function verifyBusinessRegistration(imageUrl: string): Promise<{
  verified: boolean;
  ocrResult: OCRResult;
}> {
  const ocrResult = await extractTextFromImage(imageUrl);

  // Basic verification: check if document contains business-related keywords
  const businessKeywords = ['business', 'registration', 'certificate', 'license', 'commercial'];
  const hasBusinessKeywords = businessKeywords.some(keyword => 
    ocrResult.text.toLowerCase().includes(keyword)
  );

  const verified = ocrResult.success && ocrResult.confidence > 60 && hasBusinessKeywords;

  return {
    verified,
    ocrResult,
  };
}
