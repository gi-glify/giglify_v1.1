import { useEffect } from "react";
import { useLocation } from "react-router-dom";
const SITE_URL = "https://giglify.pages.dev";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`;
const pages = {
    "/": { title: "Giglify | Microtasking, Done Right", description: "Complete focused microtasks, build your profile, and earn through Giglify." },
    "/auth": { title: "Sign in or create an account | Giglify", description: "Create your Giglify account or sign in to access available microtasks." },
    "/about": { title: "About, privacy and terms | Giglify", description: "Learn how Giglify handles privacy, data, terms, and support." },
    "/privacy": { title: "Privacy policy | Giglify", description: "Read the Giglify privacy policy and learn how account and task data is handled." },
    "/terms": { title: "Terms of use | Giglify", description: "Read the Giglify terms of use for accounts, tasks, grading, and payments." },
    "/contact": { title: "Contact Giglify | Giglify", description: "Contact the Giglify team for account, task, payment, or privacy support." },
    "/data-policy": { title: "Data policy | Giglify", description: "Learn how Giglify stores and uses account, task, and payment data." },
    "/dashboard": { title: "Dashboard | Giglify", description: "View your Giglify earnings, progress, and available tasks.", private: true },
    "/tasks": { title: "Available tasks | Giglify", description: "Browse available Giglify microtasks and start earning.", private: true },
    "/profile": { title: "Your profile | Giglify", description: "Manage your Giglify profile and verification information.", private: true },
    "/financials": { title: "Wallet and payouts | Giglify", description: "Review your Giglify balance and payout activity.", private: true },
    "/notifications": { title: "Notifications | Giglify", description: "Review your latest Giglify notifications.", private: true },
    "/settings": { title: "Settings | Giglify", description: "Manage your Giglify account settings.", private: true },
    "/thank-you": { title: "Thank you | Giglify", description: "Your message has been sent to the Giglify team." },
    "/requester/apply": { title: "Requester KYC | Giglify", description: "Submit requester identity and task details for Giglify review." },
    "/requester/tasks": { title: "Post a task | Giglify", description: "Submit a task draft for Giglify requester review." },
};
export default function PageMeta() {
    const { pathname } = useLocation();
    useEffect(() => {
        const page = pages[pathname] || (pathname.startsWith("/tasks/") ? { title: "Task | Giglify", description: "Complete a Giglify task.", private: true } : { title: "Page not found | Giglify", description: "The requested Giglify page could not be found." });
        document.title = page.title;
        const setMeta = (selector, attribute, content) => {
            let element = document.head.querySelector(selector);
            if (!element) {
                element = document.createElement("meta");
                document.head.appendChild(element);
            }
            element.setAttribute(attribute, content);
        };
        setMeta('meta[name="description"]', "name", page.description);
        setMeta('meta[property="og:title"]', "property", page.title);
        setMeta('meta[property="og:description"]', "property", page.description);
        setMeta('meta[property="og:url"]', "property", `${SITE_URL}${pathname}`);
        setMeta('meta[property="og:image"]', "property", DEFAULT_IMAGE);
        setMeta('meta[name="twitter:title"]', "name", page.title);
        setMeta('meta[name="twitter:description"]', "name", page.description);
        setMeta('meta[name="twitter:image"]', "name", DEFAULT_IMAGE);
        setMeta('meta[name="robots"]', "name", page.private ? "noindex, nofollow" : "index, follow");
    }, [pathname]);
    return null;
}
//# sourceMappingURL=PageMeta.js.map