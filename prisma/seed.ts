// 시드 데이터: 17개 시도, 정책 카테고리, 20개 샘플 정책

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 17개 시도
const REGIONS = [
  { name: '서울특별시', code: 'SEOUL', level: 1 },
  { name: '부산광역시', code: 'BUSAN', level: 1 },
  { name: '대구광역시', code: 'DAEGU', level: 1 },
  { name: '인천광역시', code: 'INCHEON', level: 1 },
  { name: '광주광역시', code: 'GWANGJU', level: 1 },
  { name: '대전광역시', code: 'DAEJEON', level: 1 },
  { name: '울산광역시', code: 'ULSAN', level: 1 },
  { name: '세종특별자치시', code: 'SEJONG', level: 1 },
  { name: '경기도', code: 'GYEONGGI', level: 1 },
  { name: '강원도', code: 'GANGWON', level: 1 },
  { name: '충청북도', code: 'CHUNGBUK', level: 1 },
  { name: '충청남도', code: 'CHUNGNAM', level: 1 },
  { name: '전라북도', code: 'JEONBUK', level: 1 },
  { name: '전라남도', code: 'JEONNAM', level: 1 },
  { name: '경상북도', code: 'GYEONGBUK', level: 1 },
  { name: '경상남도', code: 'GYEONGNAM', level: 1 },
  { name: '제주특별자치도', code: 'JEJU', level: 1 },
] as const;

// 정책 카테고리
const CATEGORIES = [
  { name: '청년', slug: 'youth', description: '청년 지원 정책', icon: 'Users' },
  { name: '창업', slug: 'startup', description: '창업 지원 정책', icon: 'Rocket' },
  { name: '복지', slug: 'welfare', description: '복지 지원 정책', icon: 'Heart' },
  { name: '고용', slug: 'employment', description: '고용 지원 정책', icon: 'Briefcase' },
  { name: '주거', slug: 'housing', description: '주거 지원 정책', icon: 'Home' },
  { name: '교육', slug: 'education', description: '교육 지원 정책', icon: 'GraduationCap' },
  { name: '문화', slug: 'culture', description: '문화 지원 정책', icon: 'Palette' },
  { name: '육아', slug: 'childcare', description: '육아 지원 정책', icon: 'Baby' },
] as const;

// 샘플 정책 20개
const SAMPLE_POLICIES = [
  { title: '청년 내일채움공제', desc: '청년 자산 형성 지원', category: 'youth', region: 'SEOUL' },
  { title: '청년 월세 지원', desc: '월세 부담 경감 지원', category: 'housing', region: 'SEOUL' },
  { title: '청년 창업 지원금', desc: '창업 초기 비용 지원', category: 'startup', region: 'GYEONGGI' },
  { title: '기초생활보장 생계급여', desc: '생활이 어려운 사람에게 급여 지급', category: 'welfare', region: 'BUSAN' },
  { title: '국민취업지원제도', desc: '취업 지원 서비스 제공', category: 'employment', region: 'DAEGU' },
  { title: '청년 디지털 일자리', desc: '디지털 분야 일자리 지원', category: 'employment', region: 'INCHEON' },
  { title: '행복주택 입주', desc: '대학생/청년 주거 지원', category: 'housing', region: 'GWANGJU' },
  { title: '청년 희망 적금', desc: '청년 저축 장려 지원', category: 'youth', region: 'DAEJEON' },
  { title: '중소기업 취업 청년 소득세 감면', desc: '소득세 감면 혜택', category: 'employment', region: 'ULSAN' },
  { title: '영유아 보육료 지원', desc: '어린이집 이용 비용 지원', category: 'childcare', region: 'SEJONG' },
  { title: '국가장학금', desc: '대학등록금 부담 경감', category: 'education', region: 'GANGWON' },
  { title: '평생교육 바우처', desc: '평생학습 참여 비용 지원', category: 'education', region: 'CHUNGBUK' },
  { title: '긴급복지지원', desc: '위기 상황 긴급 지원', category: 'welfare', region: 'CHUNGNAM' },
  { title: '창업사관학교', desc: '예비 창업자 집중 육성', category: 'startup', region: 'JEONBUK' },
  { title: '소상공인 정책자금', desc: '소상공인 경영 안정 자금 지원', category: 'startup', region: 'JEONNAM' },
  { title: '농촌 청년 보금자리', desc: '농촌 정착 지원', category: 'housing', region: 'GYEONGBUK' },
  { title: '문화누리카드', desc: '문화·관광·체육 활동 지원', category: 'culture', region: 'GYEONGNAM' },
  { title: '육아휴직 급여', desc: '육아휴직 기간 소득 보전', category: 'childcare', region: 'JEJU' },
  { title: '청년 마음건강 지원', desc: '정신건강 상담 서비스', category: 'welfare', region: 'SEOUL' },
  { title: '디지털 배움터', desc: '디지털 역량 교육 지원', category: 'education', region: 'GYEONGGI' },
] as const;

async function main(): Promise<void> {
  console.log('시드 데이터 생성 시작...');

  // 1. 지역 (17개 시도)
  const regionMap = new Map<string, string>();
  for (const region of REGIONS) {
    const created = await prisma.region.upsert({
      where: { code: region.code },
      create: region,
      update: { name: region.name },
    });
    regionMap.set(region.code, created.id);
  }
  console.log(`지역 ${REGIONS.length}개 생성 완료`);

  // 2. 정책 카테고리
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const created = await prisma.policyCategory.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: { name: cat.name, description: cat.description },
    });
    categoryMap.set(cat.slug, created.id);
  }
  console.log(`카테고리 ${CATEGORIES.length}개 생성 완료`);

  // 3. 샘플 정책 (20개)
  for (let i = 0; i < SAMPLE_POLICIES.length; i++) {
    const policy = SAMPLE_POLICIES[i]!;
    const externalId = `PUBLIC_DATA_PORTAL:SEED-${String(i + 1).padStart(3, '0')}`;
    const regionId = regionMap.get(policy.region);
    const categoryId = categoryMap.get(policy.category);

    const created = await prisma.policy.upsert({
      where: { externalId },
      create: {
        externalId,
        title: policy.title,
        description: policy.desc,
        status: 'active',
        regionId: regionId ?? null,
        sourceAgency: '정책다모아 시드',
      },
      update: {
        title: policy.title,
        description: policy.desc,
      },
    });

    // 카테고리 연결
    if (categoryId) {
      await prisma.policyCategoryRelation.upsert({
        where: {
          policyId_categoryId: {
            policyId: created.id,
            categoryId,
          },
        },
        create: { policyId: created.id, categoryId },
        update: {},
      });
    }
  }
  console.log(`정책 ${SAMPLE_POLICIES.length}개 생성 완료`);

  console.log('시드 데이터 생성 완료!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('시드 실행 오류:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
