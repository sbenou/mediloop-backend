
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Token rotation job starting...');

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get expired refresh tokens (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up expired refresh tokens from auth.refresh_tokens table
    // Note: We need to use the admin client to access auth schema
    const { data: expiredTokens, error: fetchError } = await supabaseAdmin
      .from('auth.refresh_tokens')
      .select('token')
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching expired tokens:', fetchError);
    } else {
      console.log(`Found ${expiredTokens?.length || 0} expired refresh tokens`);
    }

    // Delete expired refresh tokens
    if (expiredTokens && expiredTokens.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('auth.refresh_tokens')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (deleteError) {
        console.error('Error deleting expired tokens:', deleteError);
      } else {
        console.log(`Deleted ${expiredTokens.length} expired refresh tokens`);
      }
    }

    // Also clean up any orphaned sessions
    const { error: sessionCleanupError } = await supabaseAdmin
      .from('auth.sessions')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (sessionCleanupError) {
      console.error('Error cleaning up sessions:', sessionCleanupError);
    } else {
      console.log('Cleaned up expired sessions');
    }

    const result = {
      success: true,
      message: 'Token rotation completed successfully',
      deletedTokens: expiredTokens?.length || 0,
      timestamp: new Date().toISOString()
    };

    console.log('Token rotation job completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Token rotation job failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    );
  }
});
