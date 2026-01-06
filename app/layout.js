export const metadata = {
  title: "what armaan's upto",
  description: "tracking my winter deep work season — jan 2026",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
