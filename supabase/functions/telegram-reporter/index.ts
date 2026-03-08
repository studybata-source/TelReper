import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AccountData {
  phoneNumber: string;
  accountName: string;
}

interface ReportData {
  targetChannel: string;
  reportReason: string;
  reportCount: number;
  accountIds: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/telegram-reporter", "");

    if (path === "/add-account" && req.method === "POST") {
      const { phoneNumber, accountName }: AccountData = await req.json();

      return new Response(
        JSON.stringify({
          success: true,
          message: "Account validation initiated. Please complete verification through Telegram.",
          accountName,
          phoneNumber,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (path === "/report-channel" && req.method === "POST") {
      const { targetChannel, reportReason, reportCount, accountIds }: ReportData = await req.json();

      if (!targetChannel || !reportReason || !reportCount || !accountIds?.length) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Missing required fields",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Reporting initiated for ${targetChannel}`,
          details: {
            targetChannel,
            reportReason,
            totalReports: reportCount * accountIds.length,
            accountsUsed: accountIds.length,
          },
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Endpoint not found",
      }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
