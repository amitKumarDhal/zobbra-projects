'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Loader2, MessageCircle, ShieldCheck } from 'lucide-react';
import { API_URL } from '@/lib/api';
import {
  COUNTRY_DIAL_CODES,
  OTP_LENGTH,
  cleanNationalNumber,
  formatCountdown,
  formatPhoneForDisplay,
  isValidNationalNumber,
  toE164,
} from '@/lib/otpAuth';

export interface OtpLoginSuccess {
  token: string;
  user: { id: string; role: string; [key: string]: unknown };
}

interface WhatsAppOtpLoginProps {
  onSuccess: (result: OtpLoginSuccess) => void;
  /** Label of the verify button (e.g. "Verify & Continue" when signing in mid-flow). */
  verifyLabel?: string;
}

type Step = 'phone' | 'otp';

const WHATSAPP_GREEN = '#25D366';

async function postJson(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function networkErrorMessage(err: any): string {
  if (err?.name === 'AbortError' || err?.name === 'TimeoutError') {
    return 'Connection is taking too long. Please check your internet and try again.';
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  return 'Unable to reach ZOBBRA. Please try again.';
}

export function WhatsAppOtpLogin({ onSuccess, verifyLabel = 'Verify OTP' }: WhatsAppOtpLoginProps) {
  const [step, setStep] = useState<Step>('phone');
  const [dial, setDial] = useState('91');
  const [national, setNational] = useState('');
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const digitRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneValid = isValidNationalNumber(dial, national);
  const otp = digits.join('');

  // Resend countdown: one interval while counting, cleared when it reaches 0
  const counting = resendIn > 0;
  useEffect(() => {
    if (!counting) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [counting]);

  useEffect(() => {
    if (step === 'otp') digitRefs.current[0]?.focus();
  }, [step]);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!phoneValid) {
      setError('Please enter a valid WhatsApp number.');
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await postJson('/auth/otp/request', { phone: toE164(dial, national) });
      if (res.ok && data.success) {
        setDigits(Array(OTP_LENGTH).fill(''));
        setResendIn(Number(data.resendIn) || 30);
        setStep('otp');
      } else {
        if (data.retryAfter) setResendIn(Number(data.retryAfter));
        setError(data.message || 'Could not send the code. Please try again.');
      }
    } catch (err) {
      setError(networkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)) {
      setError(`Please enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await postJson('/auth/otp/verify', { phone: toE164(dial, national), otp });
      if (res.ok && data.success && data.token) {
        onSuccess({ token: data.token, user: data.user });
        return;
      }
      setError(data.message || 'Verification failed. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      digitRefs.current[0]?.focus();
    } catch (err) {
      setError(networkErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const changeNumber = () => {
    setStep('phone');
    setError(null);
    setDigits(Array(OTP_LENGTH).fill(''));
  };

  // ─── OTP digit input handling ──────────────────────────────────────────────

  const fillFrom = (index: number, value: string) => {
    const incoming = value.replace(/\D/g, '');
    if (!incoming) return;
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < incoming.length && index + i < OTP_LENGTH; i++) next[index + i] = incoming[i];
      return next;
    });
    const focusAt = Math.min(index + incoming.length, OTP_LENGTH - 1);
    digitRefs.current[focusAt]?.focus();
  };

  const onDigitChange = (index: number, value: string) => {
    if (value === '') {
      setDigits((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }
    fillFrom(index, value);
  };

  const onDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const onDigitPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fillFrom(index, e.clipboardData.getData('text'));
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const errorBox = error && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      role="alert"
      data-cy="otp-error"
      className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl text-sm font-medium flex items-center gap-3"
    >
      <AlertCircle className="w-5 h-5 shrink-0" />
      <span>{error}</span>
    </motion.div>
  );

  if (step === 'phone') {
    return (
      <form className="space-y-5" onSubmit={sendOtp} noValidate data-cy="otp-phone-step">
        {errorBox}
        <div className="space-y-1.5">
          <label htmlFor="otp-phone" className="text-sm font-bold text-[#050505] flex items-center gap-2">
            <MessageCircle className="w-4 h-4" style={{ color: WHATSAPP_GREEN }} aria-hidden="true" />
            WhatsApp Number
          </label>
          <div className="flex gap-2">
            <select
              aria-label="Country code"
              data-cy="otp-country-select"
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              className="shrink-0 w-[96px] px-2 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] font-semibold text-[#050505] focus:outline-none focus:border-[#050505] focus:ring-4 focus:ring-[#050505]/10"
            >
              {COUNTRY_DIAL_CODES.map((c) => (
                <option key={c.dial} value={c.dial}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              id="otp-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              data-cy="otp-phone-input"
              value={national}
              onChange={(e) => setNational(cleanNationalNumber(e.target.value))}
              placeholder={dial === '91' ? '98765 43210' : 'Phone number'}
              className="min-w-0 flex-1 px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[16px] tracking-wide text-[#050505] focus:outline-none focus:border-[#050505] focus:ring-4 focus:ring-[#050505]/10 transition-all placeholder:text-[#9CA3AF]"
            />
          </div>
          <p className="text-xs text-[#6B7280] font-medium">We&apos;ll send a 6-digit code to this number on WhatsApp.</p>
        </div>

        <button
          type="submit"
          data-cy="otp-send-button"
          disabled={loading || !phoneValid}
          className="w-full py-3.5 bg-[#050505] hover:bg-[#222222] text-white rounded-xl text-[15px] font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : null}
          {loading ? 'Sending…' : 'Send OTP'}
        </button>
      </form>
    );
  }

  return (
    <form className="space-y-5" onSubmit={verifyOtp} noValidate data-cy="otp-code-step">
      <div className="space-y-1">
        <p className="text-sm font-bold text-[#050505] flex items-center gap-2">
          <MessageCircle className="w-4 h-4" style={{ color: WHATSAPP_GREEN }} aria-hidden="true" />
          OTP sent to WhatsApp
        </p>
        <div className="flex items-center gap-2 text-sm text-[#6B7280] font-medium">
          <span data-cy="otp-sent-to">{formatPhoneForDisplay(dial, national)}</span>
          <button
            type="button"
            data-cy="otp-change-number"
            onClick={changeNumber}
            className="inline-flex items-center gap-1 font-bold text-[#3B6FEB] hover:underline min-h-[32px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Change
          </button>
        </div>
      </div>

      {errorBox}

      <fieldset>
        <legend className="sr-only">Enter the {OTP_LENGTH}-digit code</legend>
        <div className="flex justify-between gap-1.5 sm:gap-2.5" data-cy="otp-digits">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                digitRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={i === 0 ? OTP_LENGTH : 1}
              aria-label={`Digit ${i + 1}`}
              data-cy={`otp-digit-${i}`}
              value={d}
              onChange={(e) => onDigitChange(i, e.target.value)}
              onKeyDown={(e) => onDigitKeyDown(i, e)}
              onPaste={(e) => onDigitPaste(i, e)}
              onFocus={(e) => e.target.select()}
              className="w-full min-w-0 max-w-[52px] aspect-square text-center text-xl font-bold bg-white border border-[#E5E7EB] rounded-xl text-[#050505] focus:outline-none focus:border-[#050505] focus:ring-4 focus:ring-[#050505]/10 transition-all"
            />
          ))}
        </div>
      </fieldset>

      <div className="text-sm font-medium text-[#6B7280] text-center min-h-[24px]">
        {resendIn > 0 ? (
          <span data-cy="otp-resend-timer">Resend OTP in {formatCountdown(resendIn)}</span>
        ) : (
          <button
            type="button"
            data-cy="otp-resend-button"
            onClick={() => sendOtp()}
            disabled={loading}
            className="font-bold text-[#3B6FEB] hover:underline disabled:opacity-60"
          >
            Resend OTP
          </button>
        )}
      </div>

      <button
        type="submit"
        data-cy="otp-verify-button"
        disabled={loading || otp.length !== OTP_LENGTH}
        className="w-full py-3.5 bg-[#050505] hover:bg-[#222222] text-white rounded-xl text-[15px] font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 uppercase tracking-wider flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="w-4 h-4" aria-hidden="true" />}
        {loading ? 'Verifying…' : verifyLabel}
      </button>
    </form>
  );
}
