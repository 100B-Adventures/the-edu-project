'use client';

import { useRef, useState } from 'react';

import { handwritingRepository } from '@/entities/handwriting';
import { Button, Dialog, Input, showBottomToast } from '@/shared/components/ui';
import { BookOpen, Camera, CheckCheck, Plus } from 'lucide-react';

import { useImportProblemsMutation } from '../hooks/use-review';
import { TodaySolvedPicker } from './today-solved-picker';

type DialogKind = 'textbook' | 'today' | null;

const MENU_ITEM_STYLE =
  'min-h-touch-min rounded-button hover:bg-orange-1 flex w-full items-center gap-3 px-3 text-left font-body2-heading';

const importResultMessage = (created: number, skipped: number) => {
  if (created > 0) return `N회독에 ${created}문제를 넣었어요.`;
  if (skipped > 0) return '이미 N회독에 있는 문제예요.';
  return '넣을 문제가 없어요.';
};

/** 시안 review.html 접힘 B: 위 버튼 하나로 접고, 사진·교재·오늘 푼 문제 세 길을 연다 */
export const ReviewImportMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [title, setTitle] = useState('');
  const [page, setPage] = useState('');
  const [number, setNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportProblemsMutation();

  const closeDialog = () => setDialog(null);

  const report = (created: number, skipped: number) =>
    showBottomToast(importResultMessage(created, skipped));

  const handlePhotoSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    event.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) => handwritingRepository.uploadImportPhoto(file))
      );
      const result = await importMutation.mutateAsync({
        channel: 'PHOTO',
        photoMediaIds: uploaded.map((item) => item.mediaAssetId),
        photoSha256: uploaded.map((item) => item.sha256),
      });
      report(result.created.length, result.skippedDuplicates.length);
    } catch {
      showBottomToast('사진을 넣지 못했어요. 다시 시도해 주세요.');
    } finally {
      setUploading(false);
    }
  };

  const handleTextbookSubmit = async () => {
    const trimmedNumber = number.trim();
    if (!title.trim() || !trimmedNumber) return;
    try {
      const pageNumber = Number(page);
      const result = await importMutation.mutateAsync({
        channel: 'TEXTBOOK',
        textbook: {
          title: title.trim(),
          page: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : null,
          number: trimmedNumber,
        },
      });
      report(result.created.length, result.skippedDuplicates.length);
      setTitle('');
      setPage('');
      setNumber('');
      closeDialog();
    } catch {
      showBottomToast('교재 문제를 넣지 못했어요. 다시 시도해 주세요.');
    }
  };

  const handleTodaySelected = async (attemptId: number) => {
    try {
      const result = await importMutation.mutateAsync({
        channel: 'SOLVED_TODAY',
        challengeAttemptIds: [attemptId],
      });
      report(result.created.length, result.skippedDuplicates.length);
      closeDialog();
    } catch {
      showBottomToast('오늘 푼 문제를 넣지 못했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="relative ml-auto">
      <Button
        variant="primary"
        size="small"
        className="gap-1.5"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        isLoading={uploading}
        loadingText="올리는 중"
        onClick={() => setMenuOpen((open) => !open)}
        data-testid="review-import-open"
      >
        <Plus
          size={18}
          aria-hidden="true"
        />
        문제 가져오기
      </Button>
      {menuOpen && (
        <div
          role="menu"
          className="border-line-line1 rounded-card shadow-popover absolute right-0 bottom-full z-20 mb-2 flex min-w-52 flex-col border bg-white p-1.5 lg:top-full lg:bottom-auto lg:mt-2 lg:mb-0"
        >
          <Button
            variant="unstyled"
            role="menuitem"
            className={MENU_ITEM_STYLE}
            onClick={() => {
              setMenuOpen(false);
              fileRef.current?.click();
            }}
          >
            <Camera
              size={18}
              className="text-orange-9"
              aria-hidden="true"
            />
            사진으로
          </Button>
          <Button
            variant="unstyled"
            role="menuitem"
            className={MENU_ITEM_STYLE}
            onClick={() => {
              setMenuOpen(false);
              setDialog('textbook');
            }}
          >
            <BookOpen
              size={18}
              className="text-orange-9"
              aria-hidden="true"
            />
            교재에서
          </Button>
          <Button
            variant="unstyled"
            role="menuitem"
            className={MENU_ITEM_STYLE}
            onClick={() => {
              setMenuOpen(false);
              setDialog('today');
            }}
          >
            <CheckCheck
              size={18}
              className="text-orange-9"
              aria-hidden="true"
            />
            오늘 푼 문제
          </Button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label="사진 고르기"
        data-testid="review-import-file"
        onChange={(event) => void handlePhotoSelected(event)}
      />

      <Dialog
        isOpen={dialog === 'textbook'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <Dialog.Content className="max-w-dialog-sm gap-4 p-card-pad">
          <Dialog.Header>
            <Dialog.Title>교재에서</Dialog.Title>
            <Dialog.Description className="sr-only">
              교재 이름, 쪽, 번호를 적어 N회독에 넣어요
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body className="gap-3">
            <Input
              aria-label="교재 이름"
              placeholder="교재 이름"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Input
              aria-label="쪽"
              placeholder="쪽"
              inputMode="numeric"
              value={page}
              onChange={(event) => setPage(event.target.value)}
            />
            <Input
              aria-label="번호"
              placeholder="번호"
              value={number}
              onChange={(event) => setNumber(event.target.value)}
            />
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button
                variant="outlined"
                className="flex-1"
              >
                닫기
              </Button>
            </Dialog.Close>
            <Button
              className="flex-1"
              disabled={!title.trim() || !number.trim()}
              isLoading={importMutation.isPending}
              onClick={() => void handleTextbookSubmit()}
              data-testid="review-import-textbook-submit"
            >
              N회독에 넣기
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>

      <Dialog
        isOpen={dialog === 'today'}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <Dialog.Content className="max-w-dialog-sm gap-4 p-card-pad">
          <Dialog.Header>
            <Dialog.Title>오늘 푼 문제</Dialog.Title>
            <Dialog.Description className="sr-only">
              오늘 푼 문제를 골라 N회독에 넣어요
            </Dialog.Description>
          </Dialog.Header>
          <TodaySolvedPicker
            enabled={dialog === 'today'}
            onPick={(attemptId) => void handleTodaySelected(attemptId)}
          />
        </Dialog.Content>
      </Dialog>
    </div>
  );
};
