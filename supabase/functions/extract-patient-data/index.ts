import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription } = await req.json();
    
    if (!transcription) {
      throw new Error('No transcription provided');
    }

    console.log('Extracting patient data from:', transcription.substring(0, 100));

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a medical data extraction assistant. Extract structured patient information from clinical notes. Always use the extract_patient_data function to return the extracted data.`
          },
          {
            role: 'user',
            content: `Extract patient information from this clinical note:\n\n${transcription}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_patient_data',
              description: 'Extract structured patient data from clinical notes',
              parameters: {
                type: 'object',
                properties: {
                  age: {
                    type: 'string',
                    description: 'Patient age (e.g., "54 years old")'
                  },
                  history: {
                    type: 'string',
                    description: 'Medical history summary'
                  },
                  symptoms: {
                    type: 'string',
                    description: 'Current symptoms described'
                  },
                  tests: {
                    type: 'string',
                    description: 'Any tests, vitals, or measurements mentioned'
                  },
                  allergies: {
                    type: 'string',
                    description: 'Known allergies'
                  },
                  possibleCondition: {
                    type: 'string',
                    description: 'Suggested possible condition or diagnosis'
                  },
                  recommendations: {
                    type: 'string',
                    description: 'Recommended next steps or treatments'
                  }
                },
                required: ['age', 'history', 'symptoms', 'tests', 'allergies', 'possibleCondition', 'recommendations'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_patient_data' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI extraction failed');
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    // Extract the tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_patient_data') {
      throw new Error('Invalid AI response format');
    }

    const extraction = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', extraction);

    return new Response(JSON.stringify({ extraction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Extraction error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Extraction failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
