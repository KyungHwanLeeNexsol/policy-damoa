// 메인 홈 페이지
// 서비스 소개 및 환영 메시지
export default function HomePage(): React.ReactNode {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        정책다모아에 오신 것을 환영합니다
      </h1>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        정부 정책 정보를 한곳에서 검색하고, 나에게 맞는 정책을 추천받으세요. 주거, 일자리, 교육,
        복지 등 다양한 분야의 정책을 쉽게 찾아볼 수 있습니다.
      </p>
    </div>
  );
}
