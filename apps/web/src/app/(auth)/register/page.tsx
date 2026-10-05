import { redirect } from 'next/navigation';

/**
 * Customer registration is now automatic: the first verified WhatsApp OTP
 * sign-in creates the account. Old /register links (header, customizer,
 * emails) land on the OTP login and keep their returnUrl, which the login
 * page sanitizes before use.
 */
export default function RegisterPage({
  searchParams,
}: {
  searchParams: { returnUrl?: string | string[] };
}) {
  const raw = searchParams.returnUrl;
  const returnUrl = Array.isArray(raw) ? raw[0] : raw;
  redirect(returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login');
}
