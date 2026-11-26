'use client';

import { useState } from 'react';

import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

import { slice3Repository } from '../api/slice3.repository';
import type { LevelResult, LevelSession } from '../model/types';
import { Slice3Page, Slice3Status } from './slice3-layout';

export const LevelTestPage = () => {
  const [session, setSession] = useState<LevelSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [declaration, setDeclaration] = useState('');
  const [result, setResult] = useState<LevelResult | null>(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [readiness, setReadiness] = useState([false, false, false]);
  const [phase, setPhase] = useState<'readiness' | 'profile' | 'answers'>(
    'readiness'
  );
  const [schoolLevel, setSchoolLevel] = useState('');
  const [currentGrade, setCurrentGrade] = useState('');
  const [goal, setGoal] = useState('');
  const [worry, setWorry] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);

  const shareResult = async () => {
    const text =
      '오독공 58일 레벨 테스트를 마쳤어요. 결과는 선생님 확인 뒤 확정돼요.';
    try {
      if (navigator.share)
        await navigator.share({
          title: '오독공 레벨 테스트',
          text,
          url: window.location.href,
        });
      else
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setShared(true);
    } catch {
      setShared(false);
    }
  };

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const next = await slice3Repository.startLevel({
        privacyConsent,
        aiConsent,
        schoolLevel,
        currentGrade,
        goal,
        worry,
      });
      setSession(next);
      setAnswers(next.answers ?? {});
      setPhase('answers');
      if (next.status === 'SUBMITTED') {
        setResult(await slice3Repository.levelResult(next.testId));
      }
    } catch {
      setError('레벨 테스트를 시작하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!session) return;
    const missing = session.problemSetIds.some((id) => !answers[id]?.trim());
    if (missing) {
      setError('세 답안을 모두 적어 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      for (const problemSetId of session.problemSetIds) {
        await slice3Repository.answerLevel(
          session.testId,
          problemSetId,
          answers[problemSetId]
        );
      }
      if (declaration.trim()) {
        await slice3Repository.createGuestDeclaration(
          session.testId,
          declaration
        );
      }
      setResult(await slice3Repository.submitLevel(session.testId));
    } catch {
      setError('답안을 접수하지 못했어요. 작성한 내용은 화면에 남아 있어요.');
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <Slice3Page
        eyebrow="레벨 테스트 결과"
        title="선생님이 답안을 확인하고 있어요"
        description="지금 보이는 내용은 확정 등급이 아니에요. 확인이 끝나면 다음 학습 길을 알려 드려요."
      >
        <Slice3Status
          title={result.summary}
          description="혜택은 아직 미정이에요."
        />
        <div className="gap-content-gap flex flex-wrap">
          <Button
            onClick={shareResult}
            variant="outlined"
          >
            {shared ? '공유 링크를 준비했어요' : '부모님께 결과 공유'}
          </Button>
          <Button asChild>
            <Link href="/courses">58일 프로그램 보기</Link>
          </Button>
        </div>
      </Slice3Page>
    );
  }

  return (
    <Slice3Page
      eyebrow="25분 진단"
      title="어디서 막히는지부터 찾아볼게요"
      description="정답 개수로 줄 세우지 않고, 풀이에서 다음 학습 실마리를 찾습니다."
    >
      {phase === 'readiness' ? (
        <Card>
          <Card.Header>
            <div>
              <Card.Title>시작 전 확인</Card.Title>
              <Card.Description>
                종이와 펜을 준비하고, 중간에 나가도 이어서 할 수 있어요.
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Content className="gap-content-gap flex flex-col">
            {[
              '25분 동안 내 힘으로 세 문제를 풀 수 있어요.',
              '정답보다 풀이 과정과 막힌 지점을 남길게요.',
              '결과는 선생님 확인 뒤 확정된다는 걸 이해했어요.',
            ].map((label, index) => (
              <label
                key={label}
                className="font-body2-normal text-text-main min-h-touch-min flex items-center gap-3"
              >
                <input
                  type="checkbox"
                  checked={readiness[index]}
                  onChange={(event) =>
                    setReadiness((current) =>
                      current.map((value, itemIndex) =>
                        itemIndex === index ? event.target.checked : value
                      )
                    )
                  }
                />
                {label}
              </label>
            ))}
            <label className="font-body2-normal text-text-main min-h-touch-min flex items-center gap-3">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(event) => setPrivacyConsent(event.target.checked)}
              />
              레벨 테스트 진행을 위한 개인정보 처리에 동의해요.
            </label>
            <label className="font-body2-normal text-text-main min-h-touch-min flex items-center gap-3">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(event) => setAiConsent(event.target.checked)}
              />
              답안의 AI 보조 분석에 동의해요. 거절해도 선생님이 확인해요.
            </label>
            <Button
              onClick={() => setPhase('profile')}
              disabled={!readiness.every(Boolean) || !privacyConsent}
              size="cta"
            >
              레벨 테스트 시작하기
            </Button>
            {(!readiness.every(Boolean) || !privacyConsent) && (
              <div className="gap-content-gap flex flex-wrap">
                <Button
                  asChild
                  variant="outlined"
                >
                  <Link href="/library">전자책부터 둘러보기</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                >
                  <Link href="/consult">고민 상담 보기</Link>
                </Button>
              </div>
            )}
          </Card.Content>
        </Card>
      ) : phase === 'profile' ? (
        <Card>
          <Card.Header>
            <div>
              <Card.Title>지금 상태를 알려 주세요</Card.Title>
              <Card.Description>
                학년과 목표는 문제를 고르는 데만 쓰고, 결과는 선생님 확인 뒤
                확정합니다.
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Content className="gap-content-gap flex flex-col">
            <Input
              aria-label="학년"
              value={schoolLevel}
              onChange={(event) => setSchoolLevel(event.target.value)}
              maxLength={30}
              placeholder="예: 고2"
            />
            <Input
              aria-label="현재 성적"
              value={currentGrade}
              onChange={(event) => setCurrentGrade(event.target.value)}
              maxLength={30}
              placeholder="예: 3등급"
            />
            <Input
              aria-label="목표"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              maxLength={200}
              placeholder="58일 뒤 바꾸고 싶은 것"
            />
            <Textarea
              aria-label="공부 고민"
              rows={4}
              value={worry}
              onChange={(event) => setWorry(event.target.value)}
              maxLength={500}
              placeholder="풀이는 했는데 어디서 막히는지 적어 주세요."
            />
            <Button
              onClick={start}
              isLoading={busy}
              disabled={
                !schoolLevel.trim() ||
                !currentGrade.trim() ||
                !goal.trim() ||
                !worry.trim()
              }
              size="cta"
            >
              문제 풀기 시작
            </Button>
          </Card.Content>
        </Card>
      ) : session ? (
        <div className="gap-grid-gap flex flex-col">
          {session.problemSetIds.map((problemSetId, index) => (
            <Card key={problemSetId}>
              <Card.Header>
                <div>
                  <Card.Title>{index + 1}번 풀이</Card.Title>
                  <Card.Description>
                    계산 과정과 막힌 지점을 글로 남겨 주세요.
                  </Card.Description>
                </div>
              </Card.Header>
              <Textarea
                aria-label={`${index + 1}번 답안`}
                rows={5}
                value={answers[problemSetId] ?? ''}
                onChange={(event) =>
                  setAnswers((current) => ({
                    ...current,
                    [problemSetId]: event.target.value,
                  }))
                }
              />
            </Card>
          ))}
          <Card>
            <Card.Header>
              <div>
                <Card.Title>공부 의지 선언은 선택이에요</Card.Title>
                <Card.Description>
                  지금은 비공개로 저장하고, 가입 뒤 가림 미리보기를 확인해
                  공개할 수 있어요.
                </Card.Description>
              </div>
            </Card.Header>
            <Textarea
              aria-label="공부 의지 선언"
              rows={4}
              maxLength={2000}
              value={declaration}
              onChange={(event) => setDeclaration(event.target.value)}
            />
          </Card>
          <Button
            onClick={submit}
            isLoading={busy}
            size="cta"
          >
            답안 접수하기
          </Button>
        </div>
      ) : null}
      {error && (
        <p className="font-body2-heading text-system-warning">{error}</p>
      )}
    </Slice3Page>
  );
};
