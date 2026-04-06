// 데이터 수집 동기화 관련 타입 정의

/** 데이터 소스 구분 */
export type SyncSource = 'PUBLIC_DATA_PORTAL' | 'BOJO24';

/** 동기화 상태 */
export type SyncStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'AUTH_FAILED' | 'PARTIAL';

/** 동기화 로그 결과 (DataSyncLog 업데이트용) */
export interface DataSyncLogResult {
  /** 총 수집 건수 */
  totalCount: number;
  /** Upsert 성공 건수 */
  upsertCount: number;
  /** 유효성 검증 실패로 건너뛴 건수 */
  skipCount: number;
  /** 오류 발생 건수 */
  errorCount: number;
  /** 오류 메시지 (실패 시) */
  errorMessage?: string;
}
