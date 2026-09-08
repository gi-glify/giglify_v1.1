import { Resend } from 'resend';
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);
export const sendVerificationEmail = async (email, verificationLink) => {
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
        if (error)
            throw error;
        return { success: true };
    }
    catch (error) {
        console.error('Failed to send verification email:', error);
        return { success: false, error };
    }
};
export const sendPasswordResetEmail = async (email, resetLink) => {
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
        if (error)
            throw error;
        return { success: true };
    }
    catch (error) {
        console.error('Failed to send reset email:', error);
        return { success: false, error };
    }
};
export const sendDepositConfirmation = async (email, amount, currency) => {
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
        if (error)
            throw error;
        return { success: true };
    }
    catch (error) {
        console.error('Failed to send deposit confirmation:', error);
        return { success: false, error };
    }
};
export const sendWithdrawalNotification = async (email, amount, bankInfo) => {
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
        if (error)
            throw error;
        return { success: true };
    }
    catch (error) {
        console.error('Failed to send withdrawal notification:', error);
        return { success: false, error };
    }
};
export const sendTaskCompletionEmail = async (email, taskTitle, reward) => {
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
        if (error)
            throw error;
        return { success: true };
    }
    catch (error) {
        console.error('Failed to send task completion email:', error);
        return { success: false, error };
    }
};
//# sourceMappingURL=emailService.js.map