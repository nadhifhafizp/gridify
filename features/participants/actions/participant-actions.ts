"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AddParticipantSchema = z.object({
  tournamentId: z.string().uuid(),
  name: z
    .string()
    .min(1, "Nama tim wajib diisi")
    .max(50, "Nama tim terlalu panjang"),
  contact: z.string().optional(),
});

export async function addParticipantAction(formData: FormData) {
  const supabase = await createClient();

  // 1. Parsing Zod
  const validatedFields = AddParticipantSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    name: formData.get("name"),
    contact: formData.get("contact"),
  });

  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues[0].message };
  }

  const { tournamentId, name, contact } = validatedFields.data;

  // 2. Insert DB
  const { error } = await supabase.from("participants").insert({
    tournament_id: tournamentId,
    name: name,
    contact_info: contact || null,
    is_verified: true,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/tournaments/${tournamentId}/participants`);
  return { success: true };
}

export async function deleteParticipantAction(
  participantId: string,
  tournamentId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", participantId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/dashboard/tournaments/${tournamentId}/participants`);
  return { success: true };
}
