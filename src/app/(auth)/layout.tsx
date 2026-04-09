// 인증 페이지 레이아웃 - 페이지가 자체 레이아웃을 갖도록 단순 전달
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return <>{children}</>;
}
