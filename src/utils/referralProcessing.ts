
import { supabase } from '@/lib/supabase';

export async function processReferralConversion(referralEmail: string, referredUserId: string, referredUserName: string) {
  try {
    // Find the referral record
    const { data: referral } = await supabase
      .from('referrals')
      .select('id, referrer_id')
      .eq('referral_email', referralEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!referral) {
      console.log('No pending referral found for email:', referralEmail);
      return false;
    }
    
    // Get referrer information
    const { data: referrerProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', referral.referrer_id)
      .single();
      
    if (!referrerProfile) {
      console.error('Could not find referrer profile:', referral.referrer_id);
      return false;
    }
      
    // Update referral status
    await supabase
      .from('referrals')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString()
      })
      .eq('id', referral.id);
    
    // Add points to referrer (100 points for successful referral)
    const REFERRAL_POINTS = 100;
    
    // Add notification in app
    await supabase
      .from('notifications')
      .insert({
        user_id: referral.referrer_id,
        type: 'new_subscription',
        title: 'Referral Converted!',
        message: `${referredUserName || 'Someone'} has joined MediLoop through your referral! You've earned ${REFERRAL_POINTS} points.`,
        meta: {
          points: REFERRAL_POINTS,
          referralName: referredUserName
        }
      });
    
    // Send congratulatory email with confetti
    const response = await fetch('/api/functions/v1/send-referral-success-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        referrerId: referral.referrer_id,
        referrerEmail: referrerProfile.email,
        referrerName: referrerProfile.full_name,
        points: REFERRAL_POINTS,
        referralName: referredUserName
      })
    });
    
    if (!response.ok) {
      console.error('Failed to send referral success email:', await response.text());
    }
    
    return true;
  } catch (error) {
    console.error('Error processing referral conversion:', error);
    return false;
  }
}
