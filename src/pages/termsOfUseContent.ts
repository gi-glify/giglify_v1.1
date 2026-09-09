export interface TermsSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TERMS_EFFECTIVE_DATE = "September 9, 2026";

export const TERMS_OF_USE_SECTIONS: TermsSection[] = [
  {
    title: "Acceptance of these terms",
    paragraphs: [
      "These Terms of Use govern access to and use of Giglify, including the website, account areas, task marketplace, worker tools, requester tools, communications, and related services. By creating an account, signing in, submitting work, posting a task, or otherwise using Giglify, you agree to these Terms and the Privacy Policy.",
      "If you do not agree, do not create an account or use the service. If you use Giglify for an organization, you confirm that you have authority to bind that organization to these Terms.",
    ],
  },
  {
    title: "Accounts and eligibility",
    paragraphs: [
      "You must provide accurate, current information and keep it updated. You may maintain only one personal Giglify account unless Giglify gives you written permission otherwise. You are responsible for activity performed through your account and for keeping passwords, recovery methods, and connected sign-in providers secure.",
      "You must be legally able to enter these Terms and meet any age, identity, location, payment, or verification requirement that applies to the service or a particular task. We may request identity or business information before allowing requester or payout features.",
    ],
    bullets: [
      "Do not impersonate another person or organization.",
      "Do not share, sell, rent, or transfer your account.",
      "Tell us promptly if you suspect unauthorized access.",
      "Do not create replacement accounts to bypass a restriction or termination.",
    ],
  },
  {
    title: "Using Giglify",
    paragraphs: [
      "Giglify provides a platform for focused work to be described, assigned, submitted, reviewed, and, where approved, rewarded. We may change, pause, limit, or discontinue parts of the service, including task availability, eligibility rules, reward amounts, review processes, and supported payment methods.",
      "Availability can vary by country, device, profile, verification status, task capacity, quality history, and operational or legal requirements. A task listing is not a guarantee that work will remain available or that a submission will be accepted.",
    ],
  },
  {
    title: "Worker tasks and submissions",
    paragraphs: [
      "Workers must read and follow each task's instructions, submit original work, and provide truthful answers. A submission may be checked by automated validation, human review, quality sampling, fraud controls, or AI-assisted grading. Submission status, feedback, and reward eligibility are determined under the applicable task rules and review process.",
      "You grant Giglify a non-exclusive, worldwide, royalty-free license to host, reproduce, process, review, and use your submission as necessary to operate the service, validate quality, prevent abuse, resolve disputes, support the requester, and comply with law. Where a task specifies different ownership or confidentiality terms, those terms also apply.",
    ],
    bullets: [
      "Do not submit copied, fabricated, automated, or intentionally misleading work.",
      "Do not expose another person's confidential, personal, or proprietary information.",
      "Do not attempt to discover answer keys, bypass validation, manipulate grading, or interfere with task systems.",
      "Do not submit the same work to multiple tasks or accounts unless expressly permitted.",
    ],
  },
  {
    title: "Requester tasks",
    paragraphs: [
      "A requester may describe a project, research need, evaluation, or other workflow and submit a task draft for review. Requester access may require identity, organization, payment, or other verification. Approval to become a requester does not guarantee publication or completion of a particular task.",
      "Requesters must provide lawful, clear, achievable instructions, accurate reward information, and appropriate quality standards. A requester must not use Giglify to collect unlawful data, discriminate unlawfully, solicit prohibited activity, or ask workers to disclose information they are not authorized to provide.",
      "Giglify may edit, return, reject, pause, unpublish, or remove a task to protect workers, requesters, the platform, or third parties. Requester fees, deposits, rewards, and any payout obligations are subject to the displayed task terms, applicable review outcomes, and payment-provider rules.",
    ],
  },
  {
    title: "Payments and rewards",
    paragraphs: [
      "Any reward shown for a task is subject to the task instructions, successful submission, review, grading, fraud checks, and the applicable approval threshold. A displayed amount is not earned until Giglify records the submission as approved or otherwise confirms eligibility.",
      "Payment and payout processing may be provided by third-party providers. You authorize the relevant provider to process transactions and understand that provider terms, identity checks, fees, timing, limits, reversals, and local requirements may apply. Giglify may place a hold or delay a payout where required for verification, dispute handling, security, legal compliance, or provider settlement.",
      "You are responsible for taxes, reporting, and obligations arising from money you receive or pay through Giglify, unless applicable law requires Giglify or a provider to handle a specific obligation.",
    ],
  },
  {
    title: "Verification, quality, and disputes",
    paragraphs: [
      "Giglify may verify accounts, requester identities, payment details, devices, submissions, and activity. Reviews may use rules, automated checks, human reviewers, or AI-assisted tools. AI-assisted output is an operational aid and may be reviewed, corrected, or overridden.",
      "If you believe a review, rejection, account restriction, or payment decision is incorrect, use the support or appeal process made available in the app. Provide the relevant task, submission, transaction, or account details. Do not harass reviewers or attempt to influence a decision through duplicate accounts or abuse of support channels.",
    ],
  },
  {
    title: "Prohibited conduct",
    paragraphs: ["You may not use Giglify to or in connection with any activity that:"],
    bullets: [
      "violates law, regulation, court order, sanctions, or a third party's rights;",
      "involves fraud, money laundering, evasion of identity or payment checks, or deceptive activity;",
      "infringes intellectual property, confidentiality, privacy, publicity, or other rights;",
      "contains malware, harmful code, unauthorized scraping, probing, or attempts to access restricted systems;",
      "manipulates rankings, referrals, grading, rewards, reviews, availability, or platform metrics;",
      "uses bots, scripts, automation, or multiple accounts to obtain an unfair advantage unless a task expressly permits it; or",
      "harms, threatens, exploits, discriminates against, or targets another user or worker.",
    ],
  },
  {
    title: "Intellectual property and platform content",
    paragraphs: [
      "Giglify and its licensors retain rights in the platform, software, branding, interface, documentation, and service content. Except for the limited permission to use the service under these Terms, no rights are transferred to you.",
      "You retain rights you already own in content you submit, subject to the licenses needed to operate the service and any task-specific terms. You confirm that you have the rights and permissions required to submit that content and to allow Giglify to process it as described in these Terms and the Privacy Policy.",
    ],
  },
  {
    title: "Privacy and connected sign-in providers",
    paragraphs: [
      "Our Privacy Policy explains how Giglify accesses, uses, stores, and shares account, task, payment, support, and connected-provider data. If you sign in with Google, Facebook, or X, the provider's terms also apply to that provider account and authentication flow.",
      "You can review the current policy at https://giglify.co.ke/privacy. We will notify users through the app and update the public policy if we materially change how we use relevant account or provider data.",
    ],
  },
  {
    title: "Third-party services and links",
    paragraphs: [
      "Giglify may depend on or link to third-party services for authentication, hosting, email, payments, analytics, storage, communications, and AI-assisted operations. Third-party services have their own terms and privacy policies. Giglify is not responsible for a third party's independent service, availability, content, or processing outside Giglify's control.",
    ],
  },
  {
    title: "Suspension and termination",
    paragraphs: [
      "We may limit, suspend, or terminate access when we reasonably believe there is a breach of these Terms, fraud or abuse, a security risk, a legal requirement, a payment issue, a quality concern, or a risk to users or the service. We may also close accounts that remain inactive or are no longer supported in a location.",
      "Where appropriate, we may provide notice and an opportunity to appeal. Suspension or termination does not remove obligations that by their nature should continue, including payment disputes, confidentiality, intellectual property, liability limits, and record-keeping obligations. Approved amounts that are not subject to a valid hold or reversal remain subject to the applicable payout process.",
    ],
  },
  {
    title: "Disclaimers",
    paragraphs: [
      "To the extent permitted by law, Giglify is provided on an available and reasonable-efforts basis. We do not guarantee uninterrupted access, a particular number of tasks, a particular income level, task acceptance, grading accuracy, requester results, payment timing, or that the service will be error-free or meet every individual need.",
      "Giglify is not an employer, employment agency, investment service, tax adviser, legal adviser, or guarantee of work. Workers and requesters are responsible for deciding whether a task, submission, transaction, or engagement is suitable for them.",
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "To the extent permitted by applicable law, Giglify and its officers, employees, contractors, affiliates, and providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive losses, or for lost profits, data, opportunities, or goodwill arising from use of or inability to use the service.",
      "Nothing in these Terms excludes or limits liability that cannot legally be excluded or limited, including liability for fraud, intentional misconduct, or rights that applicable consumer law protects from limitation. Where liability may be limited, Giglify's aggregate liability for a claim relating to the service will not exceed the amount you paid to Giglify for the relevant service in the twelve months before the event giving rise to the claim.",
    ],
  },
  {
    title: "Indemnity",
    paragraphs: [
      "To the extent permitted by law, you agree to defend and hold harmless Giglify and its service providers from claims, losses, liabilities, costs, and reasonable expenses arising from your breach of these Terms, unlawful conduct, infringement of another person's rights, or content and instructions you submit to the service.",
    ],
  },
  {
    title: "Changes to these terms",
    paragraphs: [
      "We may update these Terms when the service, law, security requirements, or business operations change. We will publish the current version at https://giglify.co.ke/terms-of-use, show an in-product notice for material changes, and request renewed consent where required. The effective date at the top of the page identifies the version currently in force.",
      "If you continue using Giglify after the updated Terms take effect, you accept the updated Terms to the extent permitted by law. If you do not agree, stop using the service and contact us about account closure or outstanding records.",
    ],
  },
  {
    title: "Governing law and contact",
    paragraphs: [
      "These Terms are intended to be interpreted under the laws applicable to Giglify's operating entity and users, including applicable laws of Kenya where relevant. Mandatory consumer or data-protection rights in your jurisdiction are not displaced by these Terms. Any dispute process will follow applicable law and any procedure communicated by Giglify for the relevant service.",
      "Questions, notices, and support requests about these Terms can be sent to team@giglify.com or submitted through the Contact team page in Giglify.",
    ],
  },
];
