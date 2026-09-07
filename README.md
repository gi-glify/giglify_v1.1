# 🎓 Giglify - Microtasking, Done Right.

A modern full-stack platform where users earn rewards by completing academic research tasks and training AI models.

## 🌟 Features

- **Multi-Step Authentication** - Email/password + Google OAuth via Supabase
- **Task Management** - 50+ academic & RLHF training tasks
- **Device Verification** - Automatic system capability detection
- **Payment Integration** - Stripe, PayPal, M-Pesa support
- **Real-time Currency Conversion** - USD ↔ KES exchange rates
- **Gemini 2.5 AI Assistant** - Built-in copilot for task assistance
- **Responsive Design** - Mobile-first with Soft Sand palette
- **Dark Mode** - Theme toggle with localStorage persistence

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling with Soft Sand palette
- **React Router** - Routing
- **Zustand** - State management
- **Framer Motion** - Smooth animations
- **Lucide React** - Icons
- **AOS** - Scroll animations

### Backend/Services
- **Supabase** - Auth, Database (PostgreSQL), Real-time
- **Stripe** - Card payments
- **PayPal** - Wallet payments
- **M-Pesa** - Mobile money (Kenya)
- **Resend** - Email service
- **Gemini 2.5 API** - AI assistance
- **Google Fonts** - Quintessential + Nunito

## 📁 Project Structure

```
giglify-project/
├── src/
│   ├── pages/           # Page components (Auth, Dashboard, etc)
│   ├── components/      # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Utility functions
│   ├── store/          # Zustand stores
│   ├── styles/         # Global CSS
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── docs/               # Setup guides
│   ├── 1-AUTHENTICATION.md
│   ├── 2-DATABASE_SETUP.md
│   ├── 3-RESEND_EMAIL_SETUP.md
│   └── 4-PAYMENT_SETUP.md
├── public/             # Static assets
├── index.html          # HTML template
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── tailwind.config.js  # Tailwind config
├── vite.config.ts      # Vite config
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier available)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env.local`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (optional for development)
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Resend (optional)
VITE_RESEND_API_KEY=re_...

# PayPal (optional)
VITE_PAYPAL_CLIENT_ID=your_client_id

# M-Pesa (optional)
VITE_MPESA_SHORTCODE=your_shortcode
```

### 3. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
npm run preview
```

## 📚 Setup Guides

Detailed setup instructions for each service:

1. **[Authentication Setup](./docs/1-AUTHENTICATION.md)** - Supabase auth configuration
2. **[Database Setup](./docs/2-DATABASE_SETUP.md)** - PostgreSQL schema & RLS
3. **[Email Setup](./docs/3-RESEND_EMAIL_SETUP.md)** - Resend email service
4. **[Payment Setup](./docs/4-PAYMENT_SETUP.md)** - Stripe, PayPal, M-Pesa

## 🎨 Design System

### Giglify Design System
```
Primary Accent:   #F5A623 (Amber)
Base Navy:        #0F172A
Background:       #F8FAFC
Contrast Text:    #334155
```

### Typography
- **All Text**: Inter (sans-serif)

### Animations
- Fade-in: 600ms ease-in
- Slide-up: 600ms ease-out
- Pulse: 3s ease-in-out infinite

## 🔐 Security Features

- **Row Level Security (RLS)** - Database level access control
- **JWT Authentication** - Secure token-based auth
- **HTTPS Only** - Encrypted connections
- **Environment Variables** - Secrets management
- **Rate Limiting** - API endpoint protection
- **Input Validation** - Form data verification

## 📊 Page Overview

### 1. Auth (`/auth`)
- Multi-step signup flow
- Email/password authentication
- Google OAuth integration
- Theme toggle (light/dark)

### 2. Dashboard (`/dashboard`)
- User metrics (balance, tasks, tier)
- 50+ available tasks
- Task filtering by category/difficulty
- Gemini 2.5 AI assistant drawer

### 3. Device Verify (`/verify`)
- System capability detection
- CPU cores, RAM, screen resolution
- Desktop/mobile task eligibility
- Connection speed analysis

### 4. Deposit (`/deposit`)
- Subscription tier selection
- Amount input with currency toggle
- Multiple payment methods
- Real-time exchange rate display

### 5. Financials (`/financials`)
- Account balance display
- Withdrawal form ($15 minimum)
- Transaction history
- Export transaction CSV

## 🧪 Testing

### User Flows
1. **Signup Flow**: Create account → Email verification → Dashboard
2. **Task Completion**: Select task → Complete → Earn reward
3. **Deposit Flow**: Choose tier → Select payment → Process → Confirm
4. **Withdrawal**: Enter amount → Verify minimum → Submit → Status

### Test Accounts (for development)
```
Email: test@example.com
Password: TestPassword123!
```

## 📦 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Other Platforms
- Netlify
- AWS Amplify
- Railway
- Render

## 🔄 CI/CD

### GitHub Actions Example
```yaml
name: Build & Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
```

## 📈 Analytics & Monitoring

- **Sentry** - Error tracking
- **PostHog** - Product analytics
- **Logrocket** - Session replay
- **Stripe Dashboard** - Payment metrics

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Submit pull request

## 📝 License

MIT License - See LICENSE file

## 🆘 Support

For issues and questions:
- GitHub Issues
- Email: support@giglify.com
- Discord: [Join community]

## 🗺️ Roadmap

- [ ] Gemini 2.5 real-time integration
- [ ] Advanced analytics dashboard
- [ ] Team/referral system
- [ ] Mobile native apps
- [ ] Blockchain payment settlement
- [ ] Multi-language support
- [ ] API marketplace

## 👥 Team

Built with ❤️ by the full-stack developers at Giglify.

---

**Last Updated**: September 2026
**Version**: 1.0.0
