"use client";
import React, { useMemo, useState } from 'react';

export default function WebhookTesterPage() {
  const [provider, setProvider] = useState('TeleBirr');
  const [status, setStatus] = useState<'completed' | 'failed' | 'pending'>('completed');
  const [paymentReference, setPaymentReference] = useState('TEST-REF-123');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [meta, setMeta] = useState('{}');
  const [secret, setSecret] = useState('');
  const [useSignature, setUseSignature] = useState(false);
  const [resp, setResp] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const payload = useMemo(() => {
    let metaObj: Record<string, unknown> | undefined = undefined;
    try {
      metaObj = meta ? (JSON.parse(meta) as unknown as Record<string, unknown>) : undefined;
    } catch {
      metaObj = undefined;
    }
    return {
      provider,
      status,
      paymentReference: paymentReference || undefined,
      orderNumber: orderNumber || undefined,
      orderId: orderId || undefined,
      amount: amount || undefined,
      meta: metaObj,
    } as const;
  }, [provider, status, paymentReference, orderNumber, orderId, amount, meta]);

  async function hmacSha256Hex(key: string, message: string) {
    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
    const bytes = new Uint8Array(signature);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const send = async () => {
    setLoading(true);
    setResp('');
    try {
      const body = JSON.stringify(payload);
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (useSignature) {
        const sig = await hmacSha256Hex(secret, body);
        headers['x-webhook-signature'] = sig;
      } else {
        headers['x-webhook-secret'] = secret;
      }
      const res = await fetch('/api/payments/webhook', { method: 'POST', headers, body });
      const text = await res.text();
      setResp(`Status: ${res.status}\n${text}`);
    } catch (e) {
      setResp(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Payments Webhook Tester</h1>
      <p className="text-sm text-muted-foreground mb-6">Admin-only utility to simulate provider callbacks. Enter the shared secret to authorize.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Provider</span>
          <select className="border rounded p-2" value={provider} onChange={e => setProvider(e.target.value)}>
            <option>TeleBirr</option>
            <option>CBE</option>
            <option>Awash</option>
            <option>BankTransfer</option>
            <option>Other</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Status</span>
          <select className="border rounded p-2" value={status} onChange={e => setStatus(e.target.value as 'completed' | 'failed' | 'pending')}>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
            <option value="pending">pending</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Payment Reference</span>
          <input className="border rounded p-2" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="e.g., REF-123" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Order Number</span>
          <input className="border rounded p-2" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="e.g., MIN-..." />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Order ID</span>
          <input className="border rounded p-2" value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="UUID" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">Amount</span>
          <input className="border rounded p-2" value={amount} onChange={e => setAmount(e.target.value)} placeholder="optional" />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm">Meta (JSON)</span>
          <textarea className="border rounded p-2 font-mono" rows={4} value={meta} onChange={e => setMeta(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={useSignature} onChange={e => setUseSignature(e.target.checked)} />
          <span className="text-sm">Use HMAC signature header (x-webhook-signature) instead of shared secret header</span>
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm">Shared Secret</span>
          <input className="border rounded p-2" value={secret} onChange={e => setSecret(e.target.value)} placeholder="PAYMENT_WEBHOOK_SECRET" />
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button onClick={send} disabled={loading} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
            {loading ? 'Sending…' : 'Send Webhook'}
          </button>
        </div>
      </div>
      {resp && (
        <pre className="mt-6 p-4 bg-muted rounded text-sm whitespace-pre-wrap">{resp}</pre>
      )}
    </div>
  );
}
