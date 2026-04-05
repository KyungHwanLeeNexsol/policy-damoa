// 인증 페이지 레이아웃
// 네비게이션 없이 중앙 정렬된 컨텐츠만 표시
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
