'use client';

import { useState } from 'react';

import { type LessonSegment } from '@/entities/course';
import { Button } from '@/shared/components/ui';
import { Dialog } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { useSubmitCheckpointMutation } from '../../hooks';

// 30초 체크포인트 선택지 4개 — 실제 문항 콘텐츠(challengeId 연동 문제 텍스트)는
// api-contract-v2 ⑨가 choice(index)만 받는 계약이라 문항 본문 API가 없다.
// ⛔ 회장 확인 필요: 체크포인트 문항 본문(질문·보기 텍스트) 조회 엔드포인트 미정 —
// 현재는 선택지 4개(1~4) 뼈대만 렌더한다.
const CHOICE_COUNT = 4;

type SegmentCheckpointDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  segment: LessonSegment;
  lessonId: number;
  // 수강(enrollment) id — 이 화면에 진입하는 어떤 조회 API도 enrollmentId를
  // 노출하지 않는다(api-contract-v2 ①~⑫ 스캔 결과, ⑤ 주문 상태 조회에서만
  // 결제 직후 1회 나옴). ⛔ 회장 확인 필요: 세그먼트/체크포인트 조회 API에
  // enrollmentId를 함께 내려주거나, 백엔드가 lessonId+인증으로 유도하게
  // 계약을 보강해야 한다. 그 전까지 null이면 제출을 막는다(추측 전송 금지).
  enrollmentId: number | null;
  onCleared: (allSegmentsCleared: boolean) => void;
};

export const SegmentCheckpointDialog = ({
  isOpen,
  onOpenChange,
  segment,
  lessonId,
  enrollmentId,
  onCleared,
}: SegmentCheckpointDialogProps) => {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(
    null
  );
  const { mutate: submitCheckpoint, isPending } =
    useSubmitCheckpointMutation(lessonId);

  const reset = () => {
    setSelectedChoice(null);
    setFeedback(null);
  };

  const handleSubmit = () => {
    if (selectedChoice == null || enrollmentId == null) return;
    submitCheckpoint(
      {
        segmentId: segment.segmentId,
        payload: { enrollmentId, choice: selectedChoice },
      },
      {
        onSuccess: (result) => {
          if (result.correct) {
            setFeedback('correct');
            onCleared(result.allSegmentsCleared);
          } else {
            // 오답: 재시도 무제한, 페널티 없음(다크패턴 경계 — frd-v2 §4.5)
            setFeedback('incorrect');
            setSelectedChoice(null);
          }
        },
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}
    >
      <Dialog.Content className="z-(--z-layer-dialog) w-105 gap-4">
        <Dialog.Header>
          <Dialog.Title className="text-text-main">
            30초 체크포인트
          </Dialog.Title>
          <Dialog.Description className="font-body2-normal text-text-sub1">
            {segment.title} 구간을 이해했는지 확인해요. 정답을 맞혀야 다음
            세그먼트가 열려요.
          </Dialog.Description>
        </Dialog.Header>

        {feedback === 'correct' ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2
              size={40}
              className="text-system-success"
            />
            <p className="font-body1-heading text-text-main">클리어했어요</p>
          </div>
        ) : (
          <>
            {feedback === 'incorrect' && (
              <div className="bg-system-warning-alt rounded-button flex items-start gap-1.5 p-2.5">
                <AlertCircle
                  size={14}
                  className="text-system-warning mt-0.5 shrink-0"
                />
                <span className="font-caption-normal text-text-sub1">
                  아쉬워요, 다시 골라볼까요? 그 구간으로 돌아가 다시 봐도
                  좋아요. (재시도 무제한, 감점 없어요)
                </span>
              </div>
            )}
            {enrollmentId == null && (
              <div className="bg-gray-1 rounded-button flex items-start gap-1.5 p-2.5">
                <AlertCircle
                  size={14}
                  className="text-text-sub2 mt-0.5 shrink-0"
                />
                <span className="font-caption-normal text-text-sub2">
                  수강 정보를 확인하지 못해 제출할 수 없어요. 잠시 후 다시
                  시도해 주세요.
                </span>
              </div>
            )}
            <div
              role="radiogroup"
              aria-label="체크포인트 선택지"
              className="grid grid-cols-2 gap-2"
            >
              {Array.from({ length: CHOICE_COUNT }).map((_, index) => {
                const choice = index + 1;
                const selected = selectedChoice === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedChoice(choice)}
                    className={cn(
                      'border-line-line2 font-body2-heading rounded-button border py-3 transition-colors',
                      selected &&
                        'border-key-color-primary bg-orange-1 text-key-color-primary'
                    )}
                  >
                    보기 {choice}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <Dialog.Footer>
          {feedback === 'correct' ? (
            <Dialog.Close asChild>
              <Button
                size="medium"
                className="w-full"
                onClick={reset}
              >
                다음 세그먼트로
              </Button>
            </Dialog.Close>
          ) : (
            <Button
              size="medium"
              className="w-full"
              disabled={
                selectedChoice == null || isPending || enrollmentId == null
              }
              onClick={handleSubmit}
            >
              {isPending ? '채점 중…' : '제출하기'}
            </Button>
          )}
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
};
