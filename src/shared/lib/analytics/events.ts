import type { Role } from '@/entities/member';

import { getUserType } from './user';

/**
 * 공통 파라미터 타입
 */
export interface CommonEventParams {
  user_type: 'teacher' | 'student' | 'guardian' | 'admin' | 'not';
}

/**
 * room_id가 포함된 이벤트 파라미터
 */
export interface RoomEventParams extends CommonEventParams {
  room_id: number;
}

/**
 * 스터디룸 생성 이벤트 파라미터
 */
export interface StudyroomCreateParams extends CommonEventParams {
  user_id: number;
  title_length: number;
  description_length: number;
}

/**
 * 수업노트 작성 진입 이벤트 파라미터
 */
export interface StudynoteCreateEnterParams extends RoomEventParams {
  has_title: boolean;
  title_length: number;
}

/**
 * 수업노트 작성/저장 이벤트 파라미터
 */
export interface StudynoteCreateParams extends RoomEventParams {
  has_group: boolean;
  has_title: boolean;
  has_student: boolean;
  study_date: string | null;
  has_content: boolean;
  image_count: number;
  visibility: 'PUBLIC' | 'PRIVATE';
}

/**
 * 수업노트 복제 이벤트 파라미터
 */
export interface StudynoteDuplicateParams extends RoomEventParams {
  note_id: number;
  group_id: number | null;
  has_title: boolean;
  has_student: boolean;
  date: string | null;
  has_content: boolean;
  visibility: 'PUBLIC' | 'PRIVATE';
}

/**
 * 스터디룸 제목 수정 이벤트 파라미터
 */
export interface StudyroomTitleUpdateParams extends RoomEventParams {
  has_title: boolean;
  title_length: number;
}

/**
 * 노트 그룹 생성/수정/삭제 이벤트 파라미터
 */
export interface StudynoteGroupParams extends RoomEventParams {
  group_id?: number;
  has_title: boolean;
  title_length: number;
  user_id: number;
}

/**
 * 학생 초대 이벤트 파라미터
 */
export interface StudentInviteParams extends RoomEventParams {
  from_user_id: number;
  to_user_id: string;
}

/**
 * 수업종료 이벤트 파라미터
 */
export interface StudyroomEndParams extends RoomEventParams {
  teacher_id: number;
  student_id: number;
}

/**
 * 질문 작성 이벤트 파라미터
 */
export interface QuestionCreateParams extends RoomEventParams {
  user_id: number;
  has_title: boolean;
  title_length: number;
  has_content: boolean;
  content_length: number;
}

/**
 * 답글 작성 이벤트 파라미터
 */
export interface ReplyCreateParams extends RoomEventParams {
  question_id: number;
  user_id: number;
}

/**
 * 과제 작성 이벤트 파라미터
 */
export interface HomeworkCreateParams extends RoomEventParams {
  user_id: number;
  has_title: boolean;
  title_length: number;
  has_content: boolean;
  content_length: number;
  due_in_days: number | null;
}

/**
 * 과제 제출 이벤트 파라미터
 */
export interface HomeworkSubmitParams extends RoomEventParams {
  has_content: boolean;
  content_length: number;
  has_image: boolean;
  image_count: number;
}

/**
 * 과제 피드백 작성 이벤트 파라미터
 */
export interface HomeworkReplyParams extends RoomEventParams {
  has_content: boolean;
  content_length: number;
}

/**
 * 검색/필터 이벤트 파라미터
 */
export interface StudynoteFilterParams extends RoomEventParams {
  sort_method?: string;
  page_size?: number;
  search_keyword?: string;
}

/**
 * 디에듀101 목록 스크롤 깊이 이벤트 파라미터
 */
export interface Dedu101ScrollDepthParams extends CommonEventParams {
  page: 'dedu101_list';
  depth_percent: 25 | 50 | 75 | 100;
}

/**
 * 디에듀101 강사 카드 클릭 이벤트 파라미터
 */
export interface Dedu101TeacherClickParams extends CommonEventParams {
  teacher_id: number;
  card_index: number;
  sort?: string;
  subject?: string;
}

/**
 * 디에듀101 스터디룸 특징 클릭 이벤트 파라미터
 */
export interface Dedu101StudyroomFeatureClickParams extends CommonEventParams {
  room_id: number;
  feature_type: 'subject' | 'level' | 'style' | 'keyword';
  feature_value: string;
}

/**
 * 디에듀101 프로필 진입 이벤트 파라미터
 */
export interface Dedu101ProfileEnterParams extends CommonEventParams {
  target_type: 'teacher' | 'studyroom';
  target_id: number;
}

/**
 * 디에듀101 스터디룸 정보 섹션 뷰 이벤트 파라미터
 */
export interface Dedu101StudyroomInfoViewParams extends CommonEventParams {
  room_id: number;
  section: 'intro' | 'curriculum' | 'review' | 'price';
  view_ms: number;
}

/*
 * 회원가입 단계 진입 이벤트 파라미터
 */
export interface AuthSignupStepEnterParams extends CommonEventParams {
  step: 'email' | 'credential' | 'profile';
}

/**
 * 대시보드 탭 타입
 */
export type DashboardTab = 'studynote' | 'member' | 'homework';

/**
 * 대시보드 탭 클릭 이벤트 파라미터
 */
export interface DashboardTabClickParams extends CommonEventParams {
  tab: DashboardTab;
}

/**
 * 대시보드 스터디룸 필터 선택 이벤트 파라미터
 */
export interface DashboardStudyroomFilterParams extends CommonEventParams {
  room_id: number | null;
}

/**
 * 대시보드 스터디룸 클릭 이벤트 파라미터
 */
export interface DashboardStudyroomClickParams extends CommonEventParams {
  room_id: number;
}

/**
 * 대시보드 수업노트 클릭 이벤트 파라미터
 */
export interface DashboardNoteClickParams extends CommonEventParams {
  room_id: number;
  note_id: number;
}

/**
 * 대시보드 과제 클릭 이벤트 파라미터
 */
export interface DashboardHomeworkClickParams extends CommonEventParams {
  room_id: number;
  homework_id: number;
}

/**
 * 대시보드 QnA 클릭 이벤트 파라미터
 */
export interface DashboardQnaClickParams extends CommonEventParams {
  room_id: number;
  question_id: number;
}

/**
 * 이벤트 이름 상수
 */
export const GA4_EVENTS = {
  // What's new
  WHATS_NEW_VIEW: 'whats_new_view',
  WHATS_NEW_TRY: 'whats_new_try',
  WHATS_NEW_FEEDBACK: 'whats_new_feedback',
  WHATS_NEW_DISMISS: 'whats_new_dismiss',

  // Auth
  AUTH_LOGIN_CLICK: 'auth_login_click',
  AUTH_LOGIN_SUCCESS: 'auth_login_success',
  AUTH_LOGIN_FAIL: 'auth_login_fail',
  AUTH_KAKAO_LOGIN_CLICK: 'auth_kakao_login_click',
  AUTH_SIGNUP_CLICK: 'auth_signup_click',
  AUTH_SIGNUP_SUCCESS: 'auth_signup_success',
  AUTH_SIGNUP_FAIL: 'auth_signup_fail',
  AUTH_SIGNUP_STEP_ENTER: 'auth_signup_step_enter',

  // GNB
  GNB_LOGO_CLICK: 'gnb_logo_click',
  GNB_ALARM_CLICK: 'gnb_alarm_click',
  GNB_PROFILE_CLICK: 'gnb_profile_click',
  GNB_LOGOUT_CLICK: 'gnb_logout_click',
  GNB_MENU_CLICK: 'gnb_menu_click',

  // Dashboard
  DASHBOARD_STUDYROOM_CREATE_CLICK: 'dashboard_studyroom_create_click',
  DASHBOARD_MAIN_BANNER_CLICK: 'dashboard_main_banner_click',
  DASHBOARD_STUDYNOTE_CLICK: 'dashboard_studynote_click',
  DASHBOARD_TAB_CLICK: 'dashboard_tab_click',
  DASHBOARD_STUDYROOM_FILTER: 'dashboard_studyroom_filter',
  DASHBOARD_STUDYROOM_CLICK: 'dashboard_studyroom_click',
  DASHBOARD_NOTE_CLICK: 'dashboard_note_click',
  DASHBOARD_HOMEWORK_CLICK: 'dashboard_homework_click',
  DASHBOARD_QNA_CLICK: 'dashboard_qna_click',
  DASHBOARD_QNA_MORE_CLICK: 'dashboard_qna_more_click',

  // Page View
  DASHBOARD_PAGE_VIEW: 'dashboard_page_view',
  STUDYNOTE_DETAIL_PAGE_VIEW: 'studynote_detail_page_view',

  // Studyroom
  STUDYROOM_CREATE_CLICK: 'studyroom_create_click',
  STUDYROOM_CREATE_SUCCESS: 'studyroom_create_success',
  STUDYROOM_STUDENT_INVITE_OPEN: 'studyroom_student_invite_open',
  STUDYROOM_TITLE_UPDATE_OPEN: 'studyroom_title_update_open',
  STUDYROOM_TITLE_UPDATE_CLICK: 'studyroom_title_update_click',
  STUDYROOM_TITLE_UPDATE_SUCCESS: 'studyroom_title_update_success',
  STUDYROOM_TITLE_UPDATE_FAIL: 'studyroom_title_update_fail',
  STUDYROOM_DELETE_OPEN: 'studyroom_delete_open',
  STUDYROOM_DELETE_CLICK: 'studyroom_delete_click',
  STUDYROOM_DELETE_SUCCESS: 'studyroom_delete_success',
  STUDYROOM_DELETE_FAIL: 'studyroom_delete_fail',
  STUDYROOM_DELETE_CANCEL_CLICK: 'studyroom_delete_cancel_click',

  // Studyroom Tabs
  STUDYROOM_STUDYNOTE_TAB_CLICK: 'studyroom_studynote_tab_click',
  STUDYROOM_STUDENT_TAB_CLICK: 'studyroom_student_tab_click',
  STUDYROOM_QUESTION_TAB_CLICK: 'studyroom_question_tab_click',
  STUDYROOM_HOMEWORK_TAB_CLICK: 'studyroom_homework_tab_click',

  // Studynote
  STUDYROOM_STUDYNOTE_CREATE_ENTER: 'studyroom_studynote_create_enter',
  STUDYROOM_STUDYNOTE_CLICK: 'studyroom_studynote_click',
  STUDYNOTE_CREATE_CLICK: 'studynote_create_click',
  STUDYNOTE_CREATE_SUCCESS: 'studynote_create_success',
  STUDYNOTE_CREATE_FAIL: 'studynote_create_fail',
  STUDYNOTE_UPDATE_OPEN: 'studynote_update_open',
  STUDYNOTE_DUPLICATE_CLICK: 'studynote_duplicate_click',
  STUDYNOTE_DUPLICATE_SUCCESS: 'studynote_duplicate_success',
  STUDYNOTE_DUPLICATE_FAIL: 'studynote_duplicate_fail',
  STUDYNOTE_DELETE_OPEN: 'studynote_delete_open',

  // Studynote Group
  STUDYNOTE_GROUP_CREATE_OPEN: 'studynote_group_create_open',
  STUDYNOTE_GROUP_CREATE_CLICK: 'studynote_group_create_click',
  STUDYNOTE_GROUP_CREATE_SUCCESS: 'studynote_group_create_success',
  STUDYNOTE_GROUP_CREATE_FAIL: 'studynote_group_create_fail',
  STUDYNOTE_GROUP_UPDATE_OPEN: 'studynote_group_update_open',
  STUDYNOTE_GROUP_TITLE_UPDATE_CLICK: 'studynote_group_title_update_click',
  STUDYNOTE_GROUP_TITLE_UPDATE_SUCCESS: 'studynote_group_title_update_success',
  STUDYNOTE_GROUP_TITLE_UPDATE_FAIL: 'studynote_group_title_update_fail',
  STUDYNOTE_GROUP_DELETE_OPEN: 'studynote_group_delete_open',
  STUDYNOTE_GROUP_DELETE_CLICK: 'studynote_group_delete_click',
  STUDYNOTE_GROUP_DELETE_SUCCESS: 'studynote_group_delete_success',
  STUDYNOTE_GROUP_DELETE_FAIL: 'studynote_group_delete_fail',
  STUDYNOTE_GROUP_DELETE_CANCEL_CLICK: 'studynote_group_delete_cancel_click',
  STUDYNOTE_GROUP_CLICK: 'studynote_group_click',
  STUDYNOTE_GROUP_UPDATE_CLICK: 'studynote_group_update_click',

  // Studynote Filter/Search
  STUDYNOTE_LIST_ARRANGE_FILTER_CLICK: 'studynote_list_arrange_filter_click',
  STUDYNOTE_LIST_SEARCH_CLICK: 'studynote_list_search_click',

  // Student
  STUDYROOM_STUDENT_PROFILE_ENTER: 'studyroom_student_profile_enter',
  STUDENT_INVITE_CLICK: 'student_invite_click',
  STUDENT_INVITE_SUCCESS: 'student_invite_success',
  STUDENT_INVITE_FAIL: 'student_invite_fail',
  TEACHER_INVITE_IMPRESSION: 'teacher_invite_impression',
  TEACHER_INVITE_ISSUE_SUCCESS: 'teacher_invite_issue_success',
  TEACHER_INVITE_ACCEPT_SUCCESS: 'teacher_invite_accept_success',
  TEACHER_INVITE_SNOOZE: 'teacher_invite_snooze',
  STUDENT_REMOVE_SELECTED: 'studyroom_student_remove_selected',
  STUDENT_REMOVE_CONFIRMED: 'student_remove_confirmed',
  STUDYROOM_STUDENT_END_CONFIRMED: 'studyroom_student_end_confirmed',

  // Question
  STUDYROOM_QUESTION_CREATE_ENTER: 'studyroom_question_create_enter',
  STUDYROOM_QUESTION_CLICK: 'studyroom_question_click',
  QUESTION_CREATE_CLICK: 'question_create_click',
  REPLY_CREATE_CLICK: 'reply_create_click',

  // Homework
  STUDYROOM_HOMEWORK_CREATE_ENTER: 'studyroom_homework_create_enter',
  STUDYROOM_HOMEWORK_CLICK: 'studyroom_homework_click',
  HOMEWORK_CREATE_CLICK: 'homework_create_click',
  HOMEWORK_SUBMIT_CLICK: 'homework_submit_click',
  HOMEWORK_REPLY_CREATE_CLICK: 'homework_reply_create_click',

  // dedu 101
  DEDU101_LIST_SCROLL_DEPTH: 'dedu101_list_scroll_depth',
  DEDU101_TEACHER_CLICK: 'dedu101_teacher_click',
  DEDU101_STUDYROOM_FEATURE_CLICK: 'dedu101_studyroom_feature_click',
  DEDU101_PROFILE_ENTER: 'dedu101_profile_enter',
  DEDU101_STUDYROOM_INFO_VIEW: 'dedu101_studyroom_info_view',

  // Home
  HOME_DEDU101_CLICK: 'home_dedu101_click',
  HOME_START_CLICK: 'home_start_click',

  // Open Challenge — Home (MVP-E D-Home)
  HOME_VIEW: 'home_view',

  // Open Challenge (MVP-E)
  OC_LAND: 'oc_land',
  OC_START: 'oc_start',
  OC_COACH_USE: 'oc_coach_use',
  OC_SOLUTION_VIEW: 'oc_solution_view',
  OC_SUBMIT: 'oc_submit',
  OC_COMPLETE: 'oc_complete',
  OC_SIGNUP_PROMPT: 'oc_signup_prompt',
  OC_INVITE_SENT: 'oc_invite_sent',
  REWARD_SHOWN: 'reward_shown',
  VERSUS_VIEW: 'versus_view',
} as const;

// ==================== 오픈챌린지 이벤트 파라미터 ====================

/**
 * home_view — 로그인 홈(오픈챌린지 리스트) 동기 헤더 노출
 */
export interface HomeViewParams extends CommonEventParams {
  streak_day: number;
  level: number;
  points: number;
}

/**
 * oc_land — 오픈챌린지 랜딩 도달
 */
export interface OcLandParams extends CommonEventParams {
  src: string;
  entry_kind: 'normal' | 'friend';
}

/**
 * oc_start — "바로 풀기" / 문제 열람
 */
export interface OcStartParams extends CommonEventParams {
  problem_id: string;
  src: string;
}

/**
 * oc_coach_use — AI 코치 메시지 전송
 */
export interface OcCoachUseParams extends CommonEventParams {
  intent: 'concept' | 'hint' | 'chat';
  count: number;
}

/**
 * oc_solution_view — 해설(정답 공개) 열람 — 자력 깨짐 유일 기준
 */
export interface OcSolutionViewParams extends CommonEventParams {
  problem_id: string;
}

/**
 * oc_submit — 답 제출
 */
export interface OcSubmitParams extends CommonEventParams {
  is_correct: boolean;
  used_solution: boolean;
  hint_count: number;
  elapsed: number;
}

/**
 * oc_complete — 결과/보상 화면 도달 (루프 1바퀴 완주)
 */
export interface OcCompleteParams extends CommonEventParams {
  is_correct: boolean;
  tree_node: string | null;
  is_guest: boolean;
}

/**
 * oc_signup_prompt — 가입 유도 노출
 */
export interface OcSignupPromptParams extends CommonEventParams {
  trigger: 'post_reward' | 'limit_reached';
}

/**
 * oc_invite_sent — 친구 도전장 보냄
 */
export interface OcInviteSentParams extends CommonEventParams {
  problem_id: number;
}

/**
 * reward_shown — 보상 UI 렌더 (D1과 동시 배선)
 */
export interface RewardShownParams extends CommonEventParams {
  points: number;
  exp: number;
  streak: number;
  conquered: boolean;
}

/**
 * versus_view — 도전장 승패 결과 다이얼로그 열림
 */
export interface VersusViewParams extends CommonEventParams {
  outcome: 'WIN' | 'LOSE' | 'DRAW';
  is_inviter?: boolean;
}

/**
 * user_type을 자동으로 추가하는 헬퍼 함수
 */
export const withUserType = <T extends object>(
  params: Omit<T, 'user_type'>,
  role?: Role | null
): Record<string, unknown> => {
  return {
    ...params,
    user_type: getUserType(role),
  };
};
