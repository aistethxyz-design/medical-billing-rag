// Mock API service for demo mode
export class MockApiService {
  static async login(email: string, password: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@aisteth.com' && password === 'demo123') {
      return {
        success: true,
        user: {
          id: '1',
          email: 'demo@aisteth.com',
          name: 'Demo User',
          role: 'provider',
          practice: 'Demo Medical Practice'
        },
        token: 'demo-jwt-token'
      };
    }
    
    throw new Error('Invalid credentials');
  }

  static async getBillingCodes(query: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock billing codes based on query
    const mockCodes = [
      {
        code: '99213',
        type: 'CPT',
        description: 'Office or other outpatient visit for the evaluation and management of an established patient',
        category: 'Evaluation and Management',
        reimbursement: '$95.00',
        confidence: 95
      },
      {
        code: '99214',
        type: 'CPT', 
        description: 'Office or other outpatient visit for the evaluation and management of an established patient, moderate complexity',
        category: 'Evaluation and Management',
        reimbursement: '$135.00',
        confidence: 88
      },
      {
        code: 'Z00.00',
        type: 'ICD-10',
        description: 'Encounter for general adult medical examination without abnormal findings',
        category: 'Factors influencing health status',
        reimbursement: '$85.00',
        confidence: 92
      }
    ];

    return {
      success: true,
      codes: mockCodes.filter(code => 
        code.description.toLowerCase().includes(query.toLowerCase()) ||
        code.code.includes(query)
      )
    };
  }

  static async getAnalytics() {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      data: {
        totalRevenue: 485750,
        totalClaims: 1247,
        averageReimbursement: 389.50,
        rejectionRate: 3.2,
        topCodes: [
          { code: '99213', usage: 89, revenue: 8455 },
          { code: '99214', usage: 67, revenue: 9045 },
          { code: '99212', usage: 54, revenue: 4320 }
        ],
        monthlyTrend: [
          { month: 'Jan', revenue: 42500 },
          { month: 'Feb', revenue: 45200 },
          { month: 'Mar', revenue: 48750 },
          { month: 'Apr', revenue: 51200 },
          { month: 'May', revenue: 49800 },
          { month: 'Jun', revenue: 52100 }
        ]
      }
    };
  }

  static async optimizeCoding(_documentText: string) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      success: true,
      optimization: {
        currentCodes: ['99213'],
        suggestedCodes: ['99214', '99213'],
        potentialIncrease: '$40.00',
        confidence: 87,
        reasoning: 'Based on the complexity of the visit documented, upgrading to 99214 would be appropriate and could increase reimbursement.',
        complianceNotes: 'Ensure documentation supports the higher level of service.'
      }
    };
  }
}
