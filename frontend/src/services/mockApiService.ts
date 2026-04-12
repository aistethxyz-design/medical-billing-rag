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
        code: 'A003',
        type: 'OHIP',
        description: 'Minor assessment — new or existing patient',
        category: 'Assessment',
        reimbursement: '$33.70',
        confidence: 95
      },
      {
        code: 'A004',
        type: 'OHIP', 
        description: 'General assessment — comprehensive evaluation',
        category: 'Assessment',
        reimbursement: '$77.20',
        confidence: 88
      },
      {
        code: 'A007',
        type: 'OHIP',
        description: 'General re-assessment — follow-up evaluation',
        category: 'Assessment',
        reimbursement: '$33.70',
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
          { code: 'A003', usage: 89, revenue: 8455 },
          { code: 'A004', usage: 67, revenue: 9045 },
          { code: 'H101', usage: 54, revenue: 4320 }
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
        currentCodes: ['A003'],
        suggestedCodes: ['A004', 'K998'],
        potentialIncrease: '$43.50',
        confidence: 87,
        reasoning: 'Based on the complexity of the visit documented, upgrading to A004 (general assessment) would be appropriate and adding K998 (telephone consultation) could increase reimbursement.',
        complianceNotes: 'Ensure documentation supports the higher level of service.'
      }
    };
  }
}
