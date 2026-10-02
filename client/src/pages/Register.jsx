import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { validate, registerSchema } from "../lib/validation";
import FieldError, { a11y } from "../components/FieldError";

const [errors, setErrors] = useState({});
const clear = (k) => errors[k] && setErrors((p) => ({ ...p, [k]: undefined }));

const inputCls =
  "w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-500 focus:ring-1 focus:ring-white/10";

export default function Register() {
  const [channelName, setChannelName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loginUser: setAuthUser } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const result = validate(registerSchema, { channelName, email, password });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      setError("");
      setSubmitting(true);
      const data = await registerUser({ channelName, email, password });
      setAuthUser(data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.error || "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      headline="Your channel, live in a minute."
      copy="Upload videos, build an audience, and let adaptive streaming handle the rest."
    >
      <h1 className="text-3xl font-semibold tracking-tight text-white">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Set up your channel and start publishing.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="mt-8 space-y-4">
        <div>
          <label
            htmlFor="channelName"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Channel name
          </label>
          <input
            id="channelName"
            type="text"
            autoComplete="nickname"
            placeholder="Your channel name"
            value={channelName}
            onChange={(e) => {setChannelName(e.target.value); clear("channelName"); }}
            {...a11y(errors.channelName, "channelName")}
            className={inputCls}
          />
          <FieldError id="channelName" message={errors.channelName} />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {setEmail(e.target.value); clear("email"); }}
            {...a11y(errors.email, "email")}
            className={inputCls}
          />
          <FieldError id="email" message={errors.email} />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => {setPassword(e.target.value); clear("password"); }}
              {...a11y(errors.password, "password")}
              className={`${inputCls} pr-12`}
            />
            {!errors.password && (
              <p className="mt-1.5 text-xs text-zinc-600">
                8+ characters, with a letter and a number.
              </p>
            )}
            <FieldError id="password" message={errors.password} />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-white underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
