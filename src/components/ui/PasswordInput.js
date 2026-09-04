import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
/** Drop-in replacement for <input type="password" className="input-field" />
 * with a show/hide toggle. */
export default function PasswordInput({ className = '', ...props }) {
    const [visible, setVisible] = useState(false);
    return (_jsxs("div", { className: "relative", children: [_jsx("input", { ...props, type: visible ? 'text' : 'password', className: `input-field pr-11 ${className}` }), _jsx("button", { type: "button", onClick: () => setVisible((v) => !v), className: "absolute right-1 top-1/2 -translate-y-1/2 btn-icon !p-1.5", "aria-label": visible ? 'Hide password' : 'Show password', tabIndex: -1, children: visible ? _jsx(EyeOff, { size: 18 }) : _jsx(Eye, { size: 18 }) })] }));
}
//# sourceMappingURL=PasswordInput.js.map