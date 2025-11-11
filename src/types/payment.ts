export type PaymentMethod =
  | 'COD'            // Cash on Delivery
  | 'TeleBirr'       // Ethio Telecom Mobile Money
  | 'CBE'            // Commercial Bank of Ethiopia
  | 'Awash'          // Awash Bank
  | 'BankTransfer'   // Generic bank transfer
  | 'Other';

export const PAYMENT_METHODS: { key: PaymentMethod; label: string; description?: string }[] = [
  { key: 'COD', label: 'Cash on Delivery (COD)', description: 'Pay in cash upon delivery' },
  { key: 'TeleBirr', label: 'TeleBirr', description: 'Mobile money via Ethio Telecom' },
  { key: 'CBE', label: 'CBE Bank', description: 'Commercial Bank of Ethiopia payment' },
  { key: 'Awash', label: 'Awash Bank', description: 'Awash Bank payment' },
  { key: 'BankTransfer', label: 'Bank Transfer', description: 'Manual bank transfer' },
  { key: 'Other', label: 'Other', description: 'We will contact you for payment' },
];

export const PAYMENT_INSTRUCTIONS: Record<PaymentMethod, string> = {
  COD: 'Pay the full amount in cash to the delivery agent upon receiving your order.',
  TeleBirr:
    'Enter your TeleBirr phone number and reference. We will verify your payment and confirm the order. You can dial *127# to generate or check a reference.',
  CBE:
    'Transfer the total amount to our CBE account and include your Order Number as the payment remark. Account: 1000-000000-0000 (Example).',
  Awash:
    'Transfer the total amount to our Awash Bank account and include your Order Number as the payment remark. Account: 0100-000000-0000 (Example).',
  BankTransfer:
    'Send a bank transfer to the provided account and share the transfer slip. Include your Order Number as the remark.',
  Other:
    'We will contact you with further instructions to complete your payment.',
};
