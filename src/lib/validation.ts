import { z } from "zod";

const experienceSchema = z.object({
  companyName: z.string().min(1).max(255),
  position: z.string().min(1).max(255),
  yearRange: z.string().max(50).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export const applicationFormSchema = z.object({
  lowonganId: z.string().uuid(),
  registrationCode: z.string().min(1).max(50).optional(),
  periode: z.string().min(1).max(20),

  fullName: z.string().min(1).max(255),
  nik: z.string().regex(/^\d{16}$/, "No KTP harus 16 digit"),
  kkNumber: z.string().regex(/^\d{16}$/, "No KK harus 16 digit"),
  motherName: z.string().min(1).max(255),
  phone1: z.string().min(8).max(30),
  phone2: z.string().max(30).optional().or(z.literal("")),
  birthPlace: z.string().min(1).max(255),
  birthDate: z.string().min(1),
  gender: z.enum(["LAKI - LAKI", "PEREMPUAN"]),
  infoSource: z.enum(["WEBSITE", "TEMAN", "KELUARGA", "MEDIA SOSIAL"]),
  disability: z.enum(["Normal", "Tuna Rungu", "Tuna Daksa", "Tuna Wicara"]),
  workedYazaki: z.enum(["Ya", "Tidak"]),
  maritalStatus: z.enum(["SINGLE", "MENIKAH", "JANDA", "DUDA"]),
  email: z.string().email(),
  religion: z.enum(["ISLAM", "KRISTEN", "KATOLIK", "KONGHUCU", "BUDDHA", "HINDU"]),

  education: z.enum(["SMA", "SMK", "D1 (DIPLOMA 1)", "D2 (DIPLOMA 2)", "D3 (DIPLOMA 3)", "D4 (DIPLOMA 4)", "S1 (SARJANA)", "S2 (MAGISTER)"]),
  major: z.string().min(1).max(255),
  schoolName: z.string().min(1).max(255),
  gpa: z.string().min(1).max(50),

  province: z.string().min(1).max(255),
  regency: z.string().min(1).max(255),
  district: z.string().min(1).max(255),
  village: z.string().min(1).max(255),
  postalCode: z.string().min(1).max(10),
  address: z.string().min(1),

  experiences: z.array(experienceSchema).default([]),
});

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;
