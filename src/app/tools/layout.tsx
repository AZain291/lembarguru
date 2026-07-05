import './tools.css';

// Layout ini sengaja tidak render markup apa pun -- satu-satunya tujuannya
// supaya Next.js hanya memuat tools.css (Tailwind) untuk request di bawah
// /tools/**, bukan untuk seluruh app lewat globals.css.
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
