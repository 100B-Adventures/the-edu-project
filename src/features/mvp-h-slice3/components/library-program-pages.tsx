'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';

import { useSession } from '@/providers/session/session-context';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

import { slice3Repository } from '../api/slice3.repository';
import { useSlice3Resource } from '../hooks/use-slice3-resource';
import { Slice3Page, Slice3Status } from './slice3-layout';

const PROGRAM_DAY_LABEL: Record<string, string> = {
  LOCKED: '시작 전',
  OPEN: '오늘',
  MISSED: '메우는 날',
  SUBMITTED: '제출 완료',
  COMPLETED: '완료',
};

const SanitizedChapterBody = ({ bodyHtml }: { bodyHtml: string }) => {
  const [safeHtml, setSafeHtml] = useState('');
  useEffect(() => {
    let active = true;
    void import('dompurify').then(({ default: DOMPurify }) => {
      if (active) setSafeHtml(DOMPurify.sanitize(bodyHtml));
    });
    return () => {
      active = false;
    };
  }, [bodyHtml]);
  return (
    <div
      className="font-body1-normal text-text-main whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export const EbookLibraryPage = () => {
  const { status } = useSession();
  const purchased = status === 'authenticated';
  const load = useCallback(
    () =>
      purchased ? slice3Repository.library() : slice3Repository.publicLibrary(),
    [purchased]
  );
  const resource = useSlice3Resource(load);
  return (
    <Slice3Page
      eyebrow="내 서재"
      title={purchased ? '구매한 전자책' : '전자책 미리보기'}
      description={
        purchased
          ? '구매한 책은 이곳에서 이어 읽을 수 있어요.'
          : '로그인 전에는 책마다 정해진 장까지 미리 볼 수 있어요.'
      }
    >
      {resource.loading ? (
        <Slice3Status
          title="서재를 불러오는 중이에요"
          description="잠시만 기다려 주세요."
        />
      ) : resource.error ? (
        <Card>
          <Card.Title>서재를 불러오지 못했어요</Card.Title>
          <Card.Footer>
            <Button
              onClick={resource.reload}
              variant="secondary"
            >
              다시 불러오기
            </Button>
          </Card.Footer>
        </Card>
      ) : resource.data?.length ? (
        <>
          <div className="gap-grid-gap grid md:grid-cols-2">
            {resource.data.map((book) => (
              <Card key={book.ebookId}>
                <Card.Header>
                  <div>
                    <Card.Title>{book.title}</Card.Title>
                    <Card.Description>
                      전체 {book.chapterCount}장 · 미리보기{' '}
                      {book.previewChapterCount}장
                    </Card.Description>
                  </div>
                </Card.Header>
                <Card.Footer>
                  <Button
                    asChild
                    size="cta"
                  >
                    <Link href={`/library/${book.ebookId}/chapters/1`}>
                      {purchased ? '첫 장 읽기' : '첫 장 미리보기'}
                    </Link>
                  </Button>
                </Card.Footer>
              </Card>
            ))}
          </div>
          <Button
            asChild
            variant="outlined"
          >
            <Link href="/declarations/new">실전편 자기선언 쓰기</Link>
          </Button>
        </>
      ) : (
        <Slice3Status
          title={
            purchased
              ? '아직 서재가 비어 있어요'
              : '미리 볼 책을 준비하고 있어요'
          }
          description={
            purchased
              ? '전자책을 구매하면 이곳에 바로 보여요.'
              : '전자책 판매 화면을 먼저 둘러보세요.'
          }
        />
      )}
    </Slice3Page>
  );
};

export const ProgramPathPage = () => {
  const loadProgram = useCallback(() => slice3Repository.program(), []);
  const loadDays = useCallback(() => slice3Repository.programDays(), []);
  const program = useSlice3Resource(loadProgram);
  const days = useSlice3Resource(loadDays);
  const [couponError, setCouponError] = useState('');
  const handleCouponUse = async (forDate: string | null) => {
    const coupon = program.data?.coupons[0];
    if (!coupon || !forDate) {
      setCouponError('사용할 수 있는 쿠폰이나 날짜가 없어요.');
      return;
    }
    setCouponError('');
    try {
      await slice3Repository.useBufferCoupon(coupon.id, forDate);
      await Promise.all([program.reload(), days.reload()]);
    } catch {
      setCouponError(
        '버퍼 쿠폰을 사용하지 못했어요. 남은 쿠폰과 진행일을 확인해 주세요.'
      );
      await Promise.all([program.reload(), days.reload()]);
    }
  };
  return (
    <Slice3Page
      eyebrow="58일 프로그램"
      title={program.data?.courseTitle ?? '오늘 할 하루를 준비하고 있어요'}
      description="못 한 날은 실패가 아니라 조정할 날이에요. 버퍼 쿠폰으로 흐름을 이어 가세요."
    >
      {program.loading || days.loading ? (
        <Slice3Status
          title="진행표를 불러오는 중이에요"
          description="결제와 등록 상태를 확인하고 있어요."
        />
      ) : program.error || days.error || !program.data ? (
        <Slice3Status
          title="진행 중인 프로그램이 없어요"
          description="등록이 확인되면 58일 진행표가 열려요."
        />
      ) : (
        <>
          <div className="gap-content-gap flex flex-wrap">
            <span className="bg-orange-1 text-orange-11 rounded-pill font-caption-heading px-4 py-2">
              {program.data.currentDay === 0
                ? '선생님 확인 뒤 시작해요'
                : `현재 ${program.data.currentDay}일차`}
            </span>
            <span className="bg-gray-1 text-gray-9 rounded-pill font-caption-heading px-4 py-2">
              버퍼 쿠폰 {program.data.bufferCoupons}장
            </span>
          </div>
          <div className="gap-grid-gap grid sm:grid-cols-2 lg:grid-cols-4">
            {days.data?.map((day) => (
              <Card key={day.dayNo}>
                <Card.Header>
                  <div>
                    <Card.Title>{day.title}</Card.Title>
                    <Card.Description>
                      {PROGRAM_DAY_LABEL[day.status] ?? day.status}
                    </Card.Description>
                  </div>
                </Card.Header>
                <Card.Footer>
                  {day.status === 'MISSED' ? (
                    <Button
                      variant="outlined"
                      disabled={!program.data?.bufferCoupons}
                      onClick={() => void handleCouponUse(day.date)}
                    >
                      버퍼 쿠폰으로 열기
                    </Button>
                  ) : day.status === 'LOCKED' ? (
                    <Button
                      variant="outlined"
                      disabled
                    >
                      시작 전
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="secondary"
                    >
                      <Link
                        href={`/dashboard/student/program/days/${day.dayNo}`}
                      >
                        하루 열기
                      </Link>
                    </Button>
                  )}
                </Card.Footer>
              </Card>
            ))}
          </div>
          {couponError && (
            <p className="font-body2-heading text-system-warning">
              {couponError}
            </p>
          )}
        </>
      )}
    </Slice3Page>
  );
};

export const EbookChapterPage = ({
  ebookId,
  chapterNo,
}: {
  ebookId: number;
  chapterNo: number;
}) => {
  const { status } = useSession();
  const purchased = status === 'authenticated';
  const load = useCallback(
    () =>
      purchased
        ? slice3Repository.chapter(ebookId, chapterNo)
        : slice3Repository.previewChapter(ebookId, chapterNo),
    [ebookId, chapterNo, purchased]
  );
  const resource = useSlice3Resource(load);
  return (
    <Slice3Page
      eyebrow="내 서재"
      title={resource.data?.title ?? `${chapterNo}장`}
      description={
        purchased
          ? '구매한 전자책의 본문이에요.'
          : '전자책 미리보기 본문이에요.'
      }
    >
      {resource.loading ? (
        <Slice3Status
          title="본문을 불러오는 중이에요"
          description="잠시만 기다려 주세요."
        />
      ) : resource.error || !resource.data ? (
        <Slice3Status
          title="이 장을 열 수 없어요"
          description="구매한 책인지 서재에서 확인해 주세요."
        />
      ) : (
        <Card>
          <Card.Content>
            <SanitizedChapterBody bodyHtml={resource.data.bodyHtml} />
          </Card.Content>
          <Card.Footer>
            <Button
              asChild
              variant="outlined"
            >
              <Link href="/declarations/new">읽고 난 뒤 자기선언 쓰기</Link>
            </Button>
          </Card.Footer>
        </Card>
      )}
    </Slice3Page>
  );
};

export const ProgramDayPage = ({ dayNo }: { dayNo: number }) => {
  const load = useCallback(() => slice3Repository.programDay(dayNo), [dayNo]);
  const resource = useSlice3Resource(load);
  const [noteBody, setNoteBody] = useState('');
  const [anchors, setAnchors] = useState(['', '', '', '']);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const day = resource.data;
  const submit = async () => {
    const referenceAnchors = anchors
      .map((value, index) => {
        const labels = ['교재 쪽', '영상 시각', '프린트 번호', '기타 자료'];
        return value.trim() ? `${labels[index]}: ${value.trim()}` : '';
      })
      .filter(Boolean);
    if (!noteBody.trim() || referenceAnchors.length === 0) {
      setMessage('풀이와 참고 위치를 하나 이상 남겨 주세요.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await slice3Repository.submitProgramDay(
        dayNo,
        noteBody,
        referenceAnchors
      );
      await resource.reload();
    } catch {
      setMessage('풀이를 제출하지 못했어요. 작성한 내용은 화면에 남아 있어요.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Slice3Page
      eyebrow="58일 프로그램"
      title={day?.title ?? `${dayNo}일차`}
      description="먼저 풀이를 제출하면 오늘의 영상이 열려요."
    >
      {resource.loading ? (
        <Slice3Status
          title="오늘 할 일을 불러오는 중이에요"
          description="잠시만 기다려 주세요."
        />
      ) : resource.error || !day ? (
        <Slice3Status
          title="이 진행일을 열 수 없어요"
          description="진행표에서 열 수 있는 날을 확인해 주세요."
        />
      ) : (
        <Card>
          <Card.Header>
            <div>
              <Card.Title>
                {day.submitted ? '풀이 제출 완료' : '풀이를 먼저 남겨 주세요'}
              </Card.Title>
              <Card.Description>
                {day.videoUnlocked
                  ? '오늘의 영상이 열렸어요.'
                  : '제출 전에는 영상이 잠겨 있어요.'}
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Content className="gap-content-gap flex flex-col">
            <div
              className="flex flex-col gap-2"
              aria-label="오늘 과제"
            >
              {day.assignments.map((assignment) => (
                <p
                  key={assignment.assignmentKey}
                  className="font-body2-normal text-text-main"
                >
                  {assignment.status === 'DONE' ? '완료' : '할 일'} ·{' '}
                  {assignment.type === 'LESSON'
                    ? '오늘 영상'
                    : assignment.type === 'CHALLENGE'
                      ? '오늘 문제'
                      : '오늘 풀이 기록'}
                </p>
              ))}
            </div>
            {!day.submitted && (
              <>
                <Textarea
                  aria-label="오늘 풀이"
                  rows={7}
                  maxLength={3000}
                  value={noteBody}
                  onChange={(event) => setNoteBody(event.target.value)}
                  placeholder="막힌 식과 다시 고친 과정을 남겨 주세요."
                />
                {['교재 쪽', '영상 시각', '프린트 번호', '기타 자료'].map(
                  (label, index) => (
                    <Input
                      key={label}
                      aria-label={label}
                      maxLength={100}
                      value={anchors[index]}
                      onChange={(event) =>
                        setAnchors((current) =>
                          current.map((value, itemIndex) =>
                            itemIndex === index ? event.target.value : value
                          )
                        )
                      }
                      placeholder={`${label} (선택)`}
                    />
                  )
                )}
              </>
            )}
            {day.referenceAnchors.map((anchor) => (
              <p
                key={anchor}
                className="font-caption-normal text-gray-9"
              >
                참고 · {anchor}
              </p>
            ))}
          </Card.Content>
          <Card.Footer>
            {!day.submitted && (
              <Button
                onClick={submit}
                isLoading={submitting}
                size="cta"
              >
                풀이 제출하고 영상 열기
              </Button>
            )}
            <Button
              disabled={!day.videoUnlocked}
              variant="secondary"
            >
              영상 이어 보기
            </Button>
          </Card.Footer>
        </Card>
      )}
      {message && (
        <p className="font-body2-heading text-system-warning">{message}</p>
      )}
    </Slice3Page>
  );
};
