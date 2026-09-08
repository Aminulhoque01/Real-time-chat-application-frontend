"use client";

import { FormEvent, useState } from "react";
import { Loader2, MessageCircle, Phone, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/src/redux/hooks";
import { useLoginMutation } from "@/src/redux/features/auth/authApi";
import { setCredentials } from "@/src/redux/features/auth/authSlice";

 

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [login, { isLoading }] = useLoginMutation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }

    try {
      const response = await login({
        name: name.trim(),
        phone: phone.trim(),
      }).unwrap();

      console.log("LOGIN SUCCESS:", response);

      dispatch(
        setCredentials({
          user: response.data.user,
          token: response.data.token,
        }),
      );

      /*
       * Backend currently returns token in response.
       * Token handling will be implemented separately.
       */

      router.push("/chat");
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(
        "Unable to connect to server. Please try again.",
      );
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      {/* Background */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl sm:p-8">

          {/* Logo */}
          <div className="mb-7 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30">
              <MessageCircle
                size={30}
                className="text-white"
              />
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome to ChatApp
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Enter your details to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Your name
              </label>

              <div className="relative">
                <User
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Aminul Haque"
                  required
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Phone number
              </label>

              <div className="relative">
                <Phone
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="017XXXXXXXX"
                  required
                  disabled={isLoading}
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Connecting...
                </>
              ) : (
                "Continue"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            New users will automatically get an account.
            Existing users can continue directly.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Secure real-time messaging
        </p>
      </div>
    </main>
  );
}