"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useLoginForm } from "@/hooks/useLoginForm";

export default function LoginPage() {
  const { register, handleSubmit, formState, onSubmit, loading, requestError } = useLoginForm();
  const { errors } = formState;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="شعار المكتب الفني" width={88} height={88} priority className="mb-4 rounded-full" />
          <h1 className="text-2xl font-bold text-foreground">منظومة المكتب الفني</h1>
          <p className="mt-1 text-sm text-muted-foreground">سجّل الدخول للمتابعة</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 h-1 w-12 rounded-full bg-accent" aria-hidden="true" />

          {requestError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="whitespace-pre-line">{requestError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
            <Input
              label="البريد الإلكتروني"
              type="email"
              autoComplete="username"
              inputMode="email"
              dir="ltr"
              className="text-left"
              error={errors.email?.message}
              {...register("email")}
            />

            <div className="relative">
              <Input
                label="كلمة المرور"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                dir="ltr"
                className="ps-11 text-left"
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                aria-pressed={showPassword}
                className="absolute left-2 top-[34px] rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>

            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
              {!loading && <LogIn size={18} className="rotate-180" aria-hidden="true" />}
              تسجيل الدخول
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
