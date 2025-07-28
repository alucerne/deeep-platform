import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch stats from the email_activity_stats view
    const { data, error } = await supabase
      .from('email_activity_stats')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          { error: 'No stats found for this request_id' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stats: data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 