# Scholax Email Setup with Resend

## Overview
**Resend** is a modern email service built for developers. We'll use it for:
- Email verification
- Password reset
- Deposit confirmations
- Withdrawal notifications
- Task completion emails

## Why Resend?
- Simple API (no complex SMTP setup)
- Great deliverability
- Beautiful email templates
- Detailed analytics
- Affordable pricing
- Free tier: 100 emails/day

## Setup Instructions

### 1. Create Resend Account

1. Go to https://resend.com
2. Sign up with email
3. Verify email
4. Create organization (name: "Scholax")

### 2. Get API Key

1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "scholax-prod"
4. Copy the key (starts with `re_`)
5. Save securely (never commit to git)

### 3. Configure Environment Variables

Add to `.env.local`:

```env
VITE_RESEND_API_KEY=re_your_api_key_here
VITE_RESEND_FROM_EMAIL=noreply@scholax.com
```

### 4. Set Up Domain (Optional but Recommended)

For production, configure a custom domain:

1. In Resend dashboard, go to Domains
2. Click "Add domain"
3. Enter: `mail.scholax.com` or `noreply.scholax.com`
4. Follow DNS verification steps
5. Update VITE_RESEND_FROM_EMAIL to use custom domain

### 5. Install Resend SDK

```bash
npm install resend
```

### 6. Create Email Service

Create `src/services/emailService.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, verificationLink: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: import.meta.env.VITE_RESEND_FROM_EMAIL || 'noreply@scholax.com',
      to: email,
      subject: 'Verify Your Scholax Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Welcome to Scholax!</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${verificationLink}" style="
            display: inline-block;
            background: #D1BEB0;
            color: #1A1A1A;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          ">Verify Email</a>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This link expires in 24 hours.
          </p>
        </div>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: import.meta.env.VITE_RESEND_FROM_EMAIL || 'noreply@scholax.com',
      to: email,
      subject: 'Reset Your Scholax Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="
            display: inline-block;
            background: #D1BEB0;
            color: #1A1A1A;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
          ">Reset Password</a>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to send reset email:', error);
    return { success: false, error };
  }
};

export const sendDepositConfirmation = async (
  email: string,
  amount: number,
  currency: string
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: import.meta.env.VITE_RESEND_FROM_EMAIL || 'noreply@scholax.com',
      to: email,
      subject: `Deposit Confirmed: ${amount} ${currency}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Deposit Successful ✓</h2>
          <p>Your deposit has been processed:</p>
          <div style="
            background: #F8F3EA;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          ">
            <p style="margin: 0;">Amount: <strong>${amount} ${currency}</strong></p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
              Your balance has been updated.
            </p>
          </div>
          <p>Start completing tasks to earn rewards!</p>
        </div>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to send deposit confirmation:', error);
    return { success: false, error };
  }
};

export const sendWithdrawalNotification = async (
  email: string,
  amount: number,
  bankInfo: string
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: import.meta.env.VITE_RESEND_FROM_EMAIL || 'noreply@scholax.com',
      to: email,
      subject: `Withdrawal Initiated: ${amount} USD`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Withdrawal Processing</h2>
          <p>Your withdrawal request has been received:</p>
          <div style="
            background: #F8F3EA;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          ">
            <p style="margin: 0;">Amount: <strong>$${amount} USD</strong></p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
              Bank: ${bankInfo}
            </p>
          </div>
          <p>Processing time: 1-3 business days</p>
        </div>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to send withdrawal notification:', error);
    return { success: false, error };
  }
};

export const sendTaskCompletionEmail = async (
  email: string,
  taskTitle: string,
  reward: number
) => {
  try {
    const { data, error } = await resend.emails.send({
      from: import.meta.env.VITE_RESEND_FROM_EMAIL || 'noreply@scholax.com',
      to: email,
      subject: `Task Completed! +$${reward} earned`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1A1A1A;">Task Completed! 🎉</h2>
          <p>Great work! Your task has been approved:</p>
          <div style="
            background: #F8F3EA;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          ">
            <p style="margin: 0;"><strong>${taskTitle}</strong></p>
            <p style="margin: 10px 0 0 0; color: #27AE60; font-size: 18px; font-weight: bold;">
              +$${reward} USD
            </p>
          </div>
          <p>Keep up the great work!</p>
        </div>
      `,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Failed to send task completion email:', error);
    return { success: false, error };
  }
};
```

### 7. Integrate with Supabase Auth

Set Supabase to use Resend for emails:

1. Go to Authentication → Providers → Email
2. Scroll to "SMTP Settings"
3. Configure with Resend SMTP:
   - **Host**: smtp.resend.com
   - **Port**: 465
   - **Username**: (email verification token from Resend)
   - **Password**: Your API key
4. Save

Or use Resend's pre-configured integration if available.

## Email Templates

### Customization
Customize email designs in `src/templates/` folder:

```typescript
// src/templates/emailTemplates.ts
export const templates = {
  verification: (verificationLink: string) => ({
    subject: 'Verify Your Email',
    html: `...`,
  }),
  passwordReset: (resetLink: string) => ({
    subject: 'Reset Your Password',
    html: `...`,
  }),
  // etc...
};
```

## Testing Emails

### Using Resend Preview
1. Go to Resend dashboard
2. Click "Send Email"
3. Fill in test email
4. Click "Send"
5. Check inbox

### Testing in Development
Use test email addresses:
- `test@example.com`
- `dev@scholax.local`

Resend provides sandbox mode for development.

## Production Checklist

- [ ] API key configured in production environment
- [ ] Custom domain verified
- [ ] Email templates customized with branding
- [ ] SPF/DKIM/DMARC records configured (for custom domain)
- [ ] Unsubscribe links included in emails
- [ ] Tested all email types
- [ ] Monitoring enabled for failed sends
- [ ] Rate limits configured

## Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid API key" | Verify key from https://resend.com/api-keys |
| "Email not sent" | Check recipient email format |
| "High bounce rate" | Review recipient list quality |
| "Emails in spam" | Configure SPF/DKIM records |

## Cost Estimation

- Free: 100 emails/day
- Paid: $20/month for unlimited
- Per-email overage: $0.25 after free tier

## References
- Resend Docs: https://resend.com/docs
- React Email: https://react.email/ (for building emails)
- SMTP Configuration: https://resend.com/docs/send-with-smtp
