 import { NextResponse } from 'next/server';
 import { getErrorMessage } from '@/types/api';
 import { clientService } from '@/domains/clients/server';

/**
 * GET /api/clients/stats
 * Get client statistics
 */
export async function GET() {
  try {
     const result = await clientService.getClientStats();

     if (!result.success) {
       return NextResponse.json(
         { error: getErrorMessage(result.error) },
         { status: 400 }
       );
     }

     return NextResponse.json(result.data);

  } catch (error) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client statistics' },
      { status: 500 }
    );
  }
}

