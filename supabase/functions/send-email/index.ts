import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://deno.land/x/resend/mod.ts';
import { render } from 'npm:@react-email/render';
import {
  ApplicationReceivedEmail,
  ApplicationApprovedEmail,
  MissionCompleteEmail,
  RankUpEmail,
  WeeklySummaryEmail,
} from '../email-templates/index.tsx';
import * as React from 'react';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();

    let subject = '';
    let emailComponent;

    switch (type) {
      case 'application_received':
        subject = 'Intel Received: Your Street Team Application is Under Review';
        emailComponent = React.createElement(ApplicationReceivedEmail, { applicantName: data.applicantName });
        break;
      case 'application_approved':
        subject = 'Access Granted: Welcome to the Patron Pass Street Team!';
        emailComponent = React.createElement(ApplicationApprovedEmail, { applicantName: data.applicantName });
        break;
      case 'mission_complete':
        subject = `Mission Accomplished: +${data.xpEarned} XP Earned!`;
        emailComponent = React.createElement(MissionCompleteEmail, {
          agentName: data.agentName,
          missionTitle: data.missionTitle,
          xpEarned: data.xpEarned,
        });
        break;
      case 'rank_up':
        subject = `Promotion Alert: You've Reached the ${data.newRank} Rank!`;
        emailComponent = React.createElement(RankUpEmail, {
          agentName: data.agentName,
          newRank: data.newRank,
          oldRank: data.oldRank,
        });
        break;
      case 'weekly_summary':
        subject = 'Your Weekly Intel Report is Here';
        emailComponent = React.createElement(WeeklySummaryEmail, {
          agentName: data.agentName,
          xpEarned: data.xpEarned,
          leadsAdded: data.leadsAdded,
          estimatedEarnings: data.estimatedEarnings,
        });
        break;
      default:
        throw new Error(`Invalid email type: ${type}`);
    }

    const html = render(emailComponent);

    const { data: sentData, error } = await resend.emails.send({
      from: 'HQ <hq@patronpass.com>', // Replace with your verified domain
      to: [data.to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending email:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(sentData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Main function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
