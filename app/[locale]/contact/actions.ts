'use server'

import { createClient } from '@supabase/supabase-js'

export async function submitContact(formData: FormData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase.from('contacts').insert({
    nom: formData.get('nom') as string,
    telephone: formData.get('telephone') as string,
    email: formData.get('email') as string | null,
    ville_bien: formData.get('ville_bien') as string | null,
    type_bien: formData.get('type_bien') as string | null,
    message: formData.get('message') as string | null,
    source: 'contact',
  })

  if (error) {
    throw new Error(error.message)
  }
}
