import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0?target=deno";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-dev-bypass-token",
};

interface WelcomeEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received welcome email request");
    
    const { firstName, lastName, email }: WelcomeEmailRequest = await req.json();
    
    console.log(`Sending welcome email to ${firstName} ${lastName} (${email})`);

    const emailResponse = await resend.emails.send({
      from: "Aurora Equity <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Aurora Equity - Your Journey to Real Estate Investment Excellence Begins! 🏆",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #f8fafc; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%); -webkit-background-clip: text; background-clip: text; color: transparent;">Welcome to Aurora Equity</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: rgba(255, 255, 255, 0.9);">The Future of Real Estate Investing</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #06b6d4; font-size: 24px; margin: 0 0 20px 0;">Hello ${firstName}! 🎉</h2>
            
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px; color: #cbd5e1;">
              Congratulations! You've successfully joined our exclusive waitlist and secured your VIP early access to Aurora Equity - the revolutionary real estate crowdfunding platform that's about to transform how you invest.
            </p>
            
            <!-- Key Benefits -->
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 25px; margin: 25px 0;">
              <h3 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px;">What's Next for You? 🚀</h3>
              <div style="space-y: 12px;">
                <p style="margin: 8px 0; font-size: 14px; display: flex; align-items: center; color: #e2e8f0;"><span style="color: #06b6d4; margin-right: 8px;">💎</span> <strong>VIP Early Access:</strong> Be among the first to invest when we launch</p>
                <p style="margin: 8px 0; font-size: 14px; display: flex; align-items: center; color: #e2e8f0;"><span style="color: #06b6d4; margin-right: 8px;">📈</span> <strong>Exclusive Market Insights:</strong> Weekly analysis of prime real estate opportunities</p>
                <p style="margin: 8px 0; font-size: 14px; display: flex; align-items: center; color: #e2e8f0;"><span style="color: #06b6d4; margin-right: 8px;">🏢</span> <strong>Premium Property Access:</strong> First dibs on high-yield investment properties</p>
                <p style="margin: 8px 0; font-size: 14px; display: flex; align-items: center; color: #e2e8f0;"><span style="color: #06b6d4; margin-right: 8px;">🎯</span> <strong>Lower Investment Minimums:</strong> Special rates for waitlist members</p>
              </div>
            </div>
            
            <!-- What Makes Us Different -->
            <h3 style="color: #8b5cf6; font-size: 20px; margin: 30px 0 15px 0;">Why Aurora Equity? 🌟</h3>
            <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 15px;">
              We're not just another investment platform. Aurora Equity combines cutting-edge technology with deep real estate expertise to offer:
            </p>
            <ul style="color: #e2e8f0; font-size: 14px; line-height: 1.6; padding-left: 20px;">
              <li style="margin-bottom: 8px;"><strong>AI-Powered Due Diligence:</strong> Advanced algorithms analyze market trends and property potential</li>
              <li style="margin-bottom: 8px;"><strong>Fractional Ownership:</strong> Invest in premium properties with as little as €100</li>
              <li style="margin-bottom: 8px;"><strong>Transparent Returns:</strong> Real-time tracking of your investment performance</li>
              <li style="margin-bottom: 8px;"><strong>Expert Curation:</strong> Every property vetted by our seasoned real estate professionals</li>
            </ul>
            
            <!-- Coming Soon -->
            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%); border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
              <h3 style="color: #8b5cf6; margin: 0 0 10px 0; font-size: 18px;">🗓️ Launch Timeline</h3>
              <p style="color: #cbd5e1; font-size: 15px; margin-bottom: 15px;">We're putting the finishing touches on something extraordinary</p>
              <p style="color: #06b6d4; font-size: 14px; font-weight: bold;">Expected Launch: Q2 2024</p>
            </div>
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #e2e8f0; font-size: 14px; margin-bottom: 15px;">Stay connected with us:</p>
              <div style="display: flex; justify-content: center; gap: 15px;">
                <a href="#" style="color: #3b82f6; text-decoration: none; font-size: 14px;">📧 Email Updates</a>
                <a href="#" style="color: #3b82f6; text-decoration: none; font-size: 14px;">🔗 LinkedIn</a>
                <a href="#" style="color: #3b82f6; text-decoration: none; font-size: 14px;">🐦 Twitter</a>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: rgba(15, 23, 42, 0.5); padding: 25px 30px; border-top: 1px solid rgba(59, 130, 246, 0.2); text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0 0 10px 0;">
              You're receiving this email because you joined the Aurora Equity waitlist.
            </p>
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              <strong>Aurora Equity</strong> | The Future of Real Estate Investment
            </p>
          </div>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);