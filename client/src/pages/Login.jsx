import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { validate, loginSchema } from "../lib/validation";
import FieldError, { a11y } from "../components/FieldError";

const inputCls =
"w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-500 focus:ring-1 focus:ring-white/10";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loginUser: setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const clear = (k) => errors[k] && setErrors((p) => ({ ...p, [k]: undefined }));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const result = validate(loginSchema, { email, password }); 
    if(!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      setError("");
      setSubmitting(true);
      const data = await loginUser({ email, password });
      setAuthUser(data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      headline="Upload once. Plays everywhere."
      copy="Every video is converted into multiple qualities, so viewers get a smooth start on any connection."
    >
      <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
      <p className="mt-2 text-sm text-zinc-500">Sign in to continue to your channel.</p>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            value={email}
            onChange={(e) => {setEmail(e.target.value); clear("email"); }}
            {...a11y(errors.email, "email")}
            className={inputCls}
          />
          <FieldError id="email" message={errors.email} />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-300">
            Password
          </label>
          <FieldError id="password" message={errors.password} />
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => {setPassword(e.target.value); clear("password"); }}
              {...a11y(errors.password, "password")}
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              <Loader2 className="h-4 w-4 animate-spin" /> Signing in
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-sm text-zinc-500">
        New to Orbit?{" "}
        <Link to="/register" className="font-medium text-white underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}