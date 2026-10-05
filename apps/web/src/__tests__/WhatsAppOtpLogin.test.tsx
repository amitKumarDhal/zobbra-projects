// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import { WhatsAppOtpLogin } from '@/components/auth/WhatsAppOtpLogin';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      // Strip animation props and render the plain element
      get: (_t, tag: string) =>
        function MotionStub({ initial: _i, animate: _a, transition: _tr, ...rest }: any) {
          return React.createElement(tag, rest);
        },
    }
  ),
}));

type MockResponse = { status: number; body: any };

function mockFetch(responses: MockResponse[]) {
  const queue = [...responses];
  const fn = vi.fn(async () => {
    const next = queue.shift();
    if (!next) throw new Error('Unexpected fetch');
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      json: async () => next.body,
    } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

const byCy = (id: string) => document.querySelector(`[data-cy="${id}"]`) as HTMLElement;

function enterPhoneAndSend(number = '9876543210') {
  fireEvent.change(byCy('otp-phone-input'), { target: { value: number } });
  fireEvent.click(byCy('otp-send-button'));
}

function typeOtp(code: string) {
  code.split('').forEach((d, i) => fireEvent.change(byCy(`otp-digit-${i}`), { target: { value: d } }));
}

const OTP_SENT = { status: 200, body: { success: true, resendIn: 30, expiresIn: 300 } };

describe('WhatsAppOtpLogin', () => {

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('asks only for a WhatsApp number (no email/password/company fields)', () => {
    render(<WhatsAppOtpLogin onSuccess={vi.fn()} />);
    expect(screen.getByText('WhatsApp Number')).toBeTruthy();
    expect(document.querySelector('input[type="email"]')).toBeNull();
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect((byCy('otp-send-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('sends the OTP request with an E.164 number and shows the OTP screen', async () => {
    const fetchMock = mockFetch([OTP_SENT]);
    render(<WhatsAppOtpLogin onSuccess={vi.fn()} />);

    enterPhoneAndSend('98765 43210');

    await waitFor(() => expect(byCy('otp-code-step')).toBeTruthy());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/auth\/otp\/request$/);
    expect(JSON.parse(String(init.body))).toEqual({ phone: '+919876543210' });
    expect(byCy('otp-sent-to').textContent).toBe('+91 98765 43210');
    expect(byCy('otp-resend-timer').textContent).toContain('30s');
  });

  it('verifies the OTP and reports success', async () => {
    const onSuccess = vi.fn();
    const fetchMock = mockFetch([
      OTP_SENT,
      { status: 200, body: { success: true, token: 'jwt-token', user: { id: 'u1', role: 'CUSTOMER' } } },
    ]);
    render(<WhatsAppOtpLogin onSuccess={onSuccess} />);
    enterPhoneAndSend();
    await waitFor(() => expect(byCy('otp-code-step')).toBeTruthy());

    typeOtp('123456');
    fireEvent.click(byCy('otp-verify-button'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ token: 'jwt-token', user: { id: 'u1', role: 'CUSTOMER' } }));
    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/auth\/otp\/verify$/);
    expect(JSON.parse(String(init.body))).toEqual({ phone: '+919876543210', otp: '123456' });
  });

  it('fills all boxes when a full code is pasted', async () => {
    mockFetch([OTP_SENT]);
    render(<WhatsAppOtpLogin onSuccess={vi.fn()} />);
    enterPhoneAndSend();
    await waitFor(() => expect(byCy('otp-code-step')).toBeTruthy());

    fireEvent.paste(byCy('otp-digit-0'), { clipboardData: { getData: () => '654321' } });
    expect([0, 1, 2, 3, 4, 5].map((i) => (byCy(`otp-digit-${i}`) as HTMLInputElement).value).join('')).toBe('654321');
    expect((byCy('otp-verify-button') as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows the server error for a wrong OTP and clears the boxes', async () => {
    const onSuccess = vi.fn();
    mockFetch([
      OTP_SENT,
      { status: 400, body: { success: false, message: 'Incorrect code. Please check and try again.', attemptsRemaining: 4 } },
    ]);
    render(<WhatsAppOtpLogin onSuccess={onSuccess} />);
    enterPhoneAndSend();
    await waitFor(() => expect(byCy('otp-code-step')).toBeTruthy());

    typeOtp('000000');
    fireEvent.click(byCy('otp-verify-button'));

    await waitFor(() => expect(byCy('otp-error').textContent).toContain('Incorrect code'));
    expect(onSuccess).not.toHaveBeenCalled();
    expect((byCy('otp-digit-0') as HTMLInputElement).value).toBe('');
  });

  it('counts down and then offers resend', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch([OTP_SENT]);
    render(<WhatsAppOtpLogin onSuccess={vi.fn()} />);
    enterPhoneAndSend();
    await waitFor(() => expect(byCy('otp-resend-timer')).toBeTruthy());

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(byCy('otp-resend-timer').textContent).toMatch(/Resend OTP in 2\ds/);

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });
    expect(byCy('otp-resend-timer')).toBeNull();
    expect(byCy('otp-resend-button')).toBeTruthy();
  });

  it('lets the user change the number', async () => {
    mockFetch([OTP_SENT]);
    render(<WhatsAppOtpLogin onSuccess={vi.fn()} />);
    enterPhoneAndSend('9876543210');
    await waitFor(() => expect(byCy('otp-code-step')).toBeTruthy());

    fireEvent.click(byCy('otp-change-number'));
    expect(byCy('otp-phone-step')).toBeTruthy();
    expect((byCy('otp-phone-input') as HTMLInputElement).value).toBe('9876543210');
  });

  it('shows rate-limit errors from the OTP request', async () => {
    mockFetch([{ status: 429, body: { success: false, message: 'Please wait 20s before requesting a new code.', retryAfter: 20 } }]);
    render(<WhatsAppOtpLogin onSuccess={vi.fn()} />);
    enterPhoneAndSend();
    await waitFor(() => expect(byCy('otp-error').textContent).toContain('wait 20s'));
    expect(byCy('otp-phone-step')).toBeTruthy();
  });

  it('never writes the OTP to the console', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m));
    mockFetch([OTP_SENT, { status: 200, body: { success: true, token: 't', user: { id: 'u', role: 'CUSTOMER' } } }]);
    render(<WhatsAppOtpLogin onSuccess={vi.fn()} />);
    enterPhoneAndSend();
    await waitFor(() => expect(byCy('otp-code-step')).toBeTruthy());
    typeOtp('482913');
    fireEvent.click(byCy('otp-verify-button'));
    await waitFor(() => expect((byCy('otp-verify-button') as HTMLButtonElement).textContent).toContain('Verify'));

    const logged = spies.flatMap((s) => s.mock.calls.map((c) => JSON.stringify(c))).join(' ');
    expect(logged).not.toContain('482913');
    spies.forEach((s) => s.mockRestore());
  });
});
