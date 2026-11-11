import { Suspense } from "react";
import RegisterForm from "@/components/RegisterForm";

export const metadata = { title: "Form Pendaftaran — Rekrutmen SAMI" };

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Memuat form…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
