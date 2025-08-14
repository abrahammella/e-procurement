import { NextResponse } from 'next/response';
import { createServiceRoleSupabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServiceRoleSupabase();
    
    // Get all tenders with their status
    const { data: tenders, error } = await supabase
      .from('tenders')
      .select('id, code, title, status, created_at, deadline')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count by status
    const statusCounts = tenders.reduce((acc: Record<string, number>, tender) => {
      acc[tender.status] = (acc[tender.status] || 0) + 1;
      return acc;
    }, {});

    // Check for 'abierto' status specifically
    const openTenders = tenders.filter(t => t.status === 'abierto');

    // Check for invalid status values
    const validStatuses = ['abierto', 'en_evaluacion', 'cerrado', 'adjudicado'];
    const invalidTenders = tenders.filter(t => !validStatuses.includes(t.status));

    const response = {
      totalTenders: tenders.length,
      allTenders: tenders,
      statusDistribution: statusCounts,
      openTenders: {
        count: openTenders.length,
        tenders: openTenders.map(t => ({
          id: t.id,
          code: t.code,
          title: t.title,
          status: t.status
        }))
      },
      invalidStatusTenders: invalidTenders.length > 0 ? {
        count: invalidTenders.length,
        tenders: invalidTenders
      } : null,
      validStatuses
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('Error checking tender statuses:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}