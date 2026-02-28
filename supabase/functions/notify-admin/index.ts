import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  try {
    // 1. SECURITY CHECK: Ensure the request is coming from the Database (Admin)
    // We compare the Authorization header to the "Service Role Key" (which is auto-set in the environment)
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (authHeader !== `Bearer ${serviceRoleKey}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized! Only the database can trigger this.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse the Data
    const payload = await req.json()
    const { email, raw_user_meta_data } = payload.record

    // 3. Extract Name (Checks for various common ways names are stored)
    // It defaults to "Friend" if no name is found.
    const name = raw_user_meta_data?.full_name || 
                 raw_user_meta_data?.first_name || 
                 raw_user_meta_data?.name || 
                 "Friend"

    // 4. Send the Email
    const adminEmail = Deno.env.get('ADMIN_NOTIFY_EMAIL')
    const fromEmail = Deno.env.get('ADMIN_FROM_EMAIL') || 'onboarding@resend.dev'
    if (!adminEmail) {
      throw new Error('ADMIN_NOTIFY_EMAIL env var is not set')
    }
    const escapeName = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const data = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: 'New User Signup!',
      html: `
        <h2>New User Alert!</h2>
        <p><strong>Name:</strong> ${escapeName(name)}</p>
        <p><strong>Email:</strong> ${escapeName(email)}</p>
        <p>Time to celebrate!</p>
      `
    })

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})