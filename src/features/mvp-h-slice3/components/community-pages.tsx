'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';

import { slice3Repository } from '../api/slice3.repository';
import { useSlice3Resource } from '../hooks/use-slice3-resource';
import type { Declaration, FeedItem } from '../model/types';
import { Slice3Page, Slice3Status } from './slice3-layout';

export const PublicFeedPage = ({
  initialKind = 'NOTE',
}: {
  initialKind?: FeedItem['kind'];
}) => {
  const [kind, setKind] = useState<FeedItem['kind']>(initialKind);
  const load = useCallback(() => slice3Repository.feed(kind), [kind]);
  const resource = useSlice3Resource(load);
  return (
    <Slice3Page
      eyebrow="오독공 커뮤니티"
      title="막힌 자리를 먼저 지나간 사람들"
      description="순위를 매기지 않고, 공개에 동의한 노트와 다짐만 보여요."
    >
      <div className="gap-content-gap flex flex-wrap">
        <Button
          variant={kind === 'NOTE' ? 'primary' : 'outlined'}
          onClick={() => setKind('NOTE')}
        >
          공개 노트
        </Button>
        <Button
          variant={kind === 'DECLARATION' ? 'primary' : 'outlined'}
          onClick={() => setKind('DECLARATION')}
        >
          자기선언
        </Button>
        <Button
          asChild
          variant="secondary"
        >
          <Link href="/declarations/new">내 선언 쓰기</Link>
        </Button>
        <Button
          asChild
          variant="outlined"
        >
          <Link href="/community/notes/new">내 노트 공개하기</Link>
        </Button>
      </div>
      {resource.loading ? (
        <Slice3Status
          title="공개 글을 불러오는 중이에요"
          description="잠시만 기다려 주세요."
        />
      ) : resource.error ? (
        <Slice3Status
          title="공개 글을 불러오지 못했어요"
          description="잠시 뒤 다시 시도해 주세요."
        />
      ) : resource.data?.length ? (
        <div className="gap-grid-gap grid md:grid-cols-2">
          {resource.data.map((item) => (
            <Card key={`${item.kind}-${item.id}`}>
              <Card.Header>
                <div>
                  <Card.Title>
                    {item.best ? `이번 주 우수 · ${item.title}` : item.title}
                  </Card.Title>
                  <Card.Description>{item.preview}</Card.Description>
                </div>
              </Card.Header>
              <Card.Footer>
                {item.kind === 'NOTE' && (
                  <Button
                    asChild
                    variant="secondary"
                  >
                    <Link href={`/community/notes/${item.id}`}>노트 보기</Link>
                  </Button>
                )}
                <span className="font-caption-normal text-gray-9">
                  응원 {item.cheers}
                </span>
              </Card.Footer>
            </Card>
          ))}
        </div>
      ) : (
        <Slice3Status
          title={
            kind === 'DECLARATION'
              ? '아직 올라온 다짐이 없어요'
              : '아직 공개된 노트가 없어요'
          }
          description="첫 글을 남겨 다음 학생의 시작을 도와주세요."
        />
      )}
    </Slice3Page>
  );
};

export const PublicNotePage = ({ id }: { id: number }) => {
  const load = useCallback(() => slice3Repository.feedItem(id), [id]);
  const resource = useSlice3Resource(load);
  const [cheered, setCheered] = useState(false);
  const [reported, setReported] = useState(false);
  const cheer = async () => {
    try {
      await slice3Repository.cheer(id);
      setCheered(true);
    } catch {
      setCheered(false);
    }
  };
  const report = async () => {
    try {
      await slice3Repository.reportContent('NOTE', id, 'INAPPROPRIATE');
      setReported(true);
    } catch {
      setReported(false);
    }
  };
  return (
    <Slice3Page
      eyebrow="공개 노트"
      title={resource.data?.title ?? '노트를 불러오고 있어요'}
      description="작성자가 공개에 동의한 가림 사본이에요."
    >
      {resource.loading ? (
        <Slice3Status
          title="노트를 불러오는 중이에요"
          description="잠시만 기다려 주세요."
        />
      ) : resource.error || !resource.data ? (
        <Slice3Status
          title="볼 수 없는 노트예요"
          description="비공개로 바뀌었거나 숨김 처리됐을 수 있어요."
        />
      ) : (
        <Card>
          <Card.Content>
            <p className="font-body1-normal text-text-main whitespace-pre-wrap">
              {resource.data.preview}
            </p>
          </Card.Content>
          <Card.Footer>
            <Button
              onClick={cheer}
              disabled={cheered}
            >
              {cheered ? '응원을 보냈어요' : '응원 보내기'}
            </Button>
            <Button
              variant="ghost"
              onClick={report}
              disabled={reported}
            >
              {reported ? '신고를 접수했어요' : '신고하기'}
            </Button>
          </Card.Footer>
        </Card>
      )}
    </Slice3Page>
  );
};

export const PublishNotePage = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState<FeedItem | null>(null);
  const [message, setMessage] = useState('');
  const publish = async () => {
    if (!title.trim() || !body.trim()) {
      setMessage('제목과 공개할 내용을 적어 주세요.');
      return;
    }
    try {
      setPublished(await slice3Repository.publishNote(title, body));
      setMessage('');
    } catch {
      setMessage('노트를 공개하지 못했어요. 로그인과 내용을 확인해 주세요.');
    }
  };
  return (
    <Slice3Page
      eyebrow="공개 노트"
      title="가림 사본만 커뮤니티에 올려요"
      description="원본 노트는 바뀌지 않아요. 이름·학교·연락처를 가린 미리보기만 공개합니다."
    >
      <Card>
        <Card.Content className="gap-content-gap flex flex-col">
          <Input
            aria-label="공개 노트 제목"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            placeholder="공개 노트 제목"
          />
          <Textarea
            aria-label="공개 노트 내용"
            rows={8}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={5000}
          />
          <Button
            onClick={publish}
            size="cta"
          >
            가림 사본 공개하기
          </Button>
        </Card.Content>
      </Card>
      {published && (
        <Slice3Status
          title="공개했어요"
          description={published.preview}
        />
      )}
      {message && (
        <p className="font-body2-heading text-system-warning">{message}</p>
      )}
    </Slice3Page>
  );
};

export const DeclarationPage = () => {
  const [kind, setKind] = useState<Declaration['kind']>('RESOLVE');
  const [body, setBody] = useState('');
  const [aiConsent, setAiConsent] = useState(false);
  const [saved, setSaved] = useState<Declaration | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const save = async () => {
    if (!body.trim()) return setMessage('다짐을 적어 주세요.');
    setBusy(true);
    setMessage('');
    try {
      setSaved(await slice3Repository.createDeclaration(kind, body, aiConsent));
    } catch {
      setMessage('선언을 저장하지 못했어요. 작성한 내용은 화면에 남아 있어요.');
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    if (!saved) return;
    setBusy(true);
    try {
      setSaved(await slice3Repository.publishDeclaration(saved.id));
    } catch {
      setMessage('공개할 수 없어요. 만 14세 미만 계정은 비공개로만 저장돼요.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Slice3Page
      eyebrow="자기선언"
      title="지킬 약속을 내 말로 적어요"
      description="기본은 비공개예요. 공개 전 연락처와 이메일을 가린 미리보기를 확인합니다."
    >
      <Card>
        <Card.Content className="gap-content-gap flex flex-col">
          <div className="gap-content-gap flex flex-wrap">
            {(['RESOLVE', 'RETRO', 'PLEDGE'] as const).map((value) => (
              <Button
                key={value}
                variant={kind === value ? 'primary' : 'outlined'}
                onClick={() => setKind(value)}
              >
                {value === 'RESOLVE'
                  ? '결심'
                  : value === 'RETRO'
                    ? '회고'
                    : '약속'}
              </Button>
            ))}
          </div>
          <Textarea
            aria-label="자기선언 내용"
            rows={8}
            maxLength={2000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <label className="font-body2-normal text-text-main min-h-touch-min flex items-center gap-3">
            <input
              type="checkbox"
              checked={aiConsent}
              onChange={(event) => setAiConsent(event.target.checked)}
            />
            다짐의 AI 보조 피드백에 동의해요. 동의하지 않아도 저장할 수 있어요.
          </label>
          <Button
            onClick={save}
            isLoading={busy}
            size="cta"
          >
            비공개로 저장하기
          </Button>
        </Card.Content>
      </Card>
      {saved && (
        <Card>
          <Card.Header>
            <div>
              <Card.Title>공개 전 가림 미리보기</Card.Title>
              <Card.Description>{saved.redactedPreview}</Card.Description>
              {saved.evalStatus === 'COMPLETED' && saved.evaluation && (
                <p className="font-body2-normal text-text-sub mt-3">
                  {saved.evaluation}
                </p>
              )}
              {saved.evalStatus === 'WAITING' && (
                <p className="font-body2-normal text-text-sub mt-3">
                  평가는 나중에 받아요. 다짐은 안전하게 저장됐어요.
                </p>
              )}
            </div>
          </Card.Header>
          <Card.Footer>
            <Button
              onClick={publish}
              disabled={saved.visibility === 'PUBLIC_ANON'}
            >
              {saved.visibility === 'PUBLIC_ANON'
                ? '익명 공개 중'
                : '익명으로 공개하기'}
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

const monday = () => {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
};

export const BestNotesPage = () => {
  const weekOf = monday();
  const load = useCallback(() => slice3Repository.bestCandidates(), []);
  const resource = useSlice3Resource(load);
  const [reason, setReason] = useState<Record<number, string>>({});
  const [enrollmentId, setEnrollmentId] = useState('');
  const [enrollmentMessage, setEnrollmentMessage] = useState('');
  const toggle = async (id: number, selected: boolean) => {
    if (!selected && !reason[id]?.trim()) return;
    if (selected) await slice3Repository.deleteBest(id, weekOf);
    else await slice3Repository.pickBest(id, reason[id], weekOf);
    await resource.reload();
  };
  const confirmEnrollment = async () => {
    const id = Number(enrollmentId);
    if (!Number.isSafeInteger(id) || id <= 0) return;
    try {
      const result = await slice3Repository.confirmProgramEnrollment(id);
      setEnrollmentMessage(
        result.roomConnectionRequired
          ? '등록을 확인했어요. 코스에 교무실 연결이 필요해요.'
          : '등록을 확인하고 교무실에 학생을 연결했어요.'
      );
    } catch {
      setEnrollmentMessage('내 코스의 결제 학생인지 확인해 주세요.');
    }
  };
  return (
    <Slice3Page
      eyebrow="선생님 교무실"
      title="이번 주 베스트"
      description="내 수업 학생이 공개한 노트만 후보예요. 선정과 선물 발송은 선생님이 직접 확인합니다."
    >
      <Card>
        <Card.Header>
          <div>
            <Card.Title>58일 결제 학생 확인</Card.Title>
            <Card.Description>
              확인하면 연결된 교무실에 학생이 들어옵니다.
            </Card.Description>
          </div>
        </Card.Header>
        <Card.Content className="gap-content-gap flex flex-col sm:flex-row">
          <Input
            aria-label="수강 등록 번호"
            inputMode="numeric"
            value={enrollmentId}
            onChange={(event) => setEnrollmentId(event.target.value)}
            placeholder="수강 등록 번호"
          />
          <Button onClick={confirmEnrollment}>등록 확인</Button>
        </Card.Content>
        {enrollmentMessage && (
          <Card.Footer>
            <span className="font-caption-normal text-gray-9">
              {enrollmentMessage}
            </span>
          </Card.Footer>
        )}
      </Card>
      {resource.loading ? (
        <Slice3Status
          title="후보를 불러오는 중이에요"
          description="잠시만 기다려 주세요."
        />
      ) : resource.data?.length ? (
        <div className="gap-grid-gap grid md:grid-cols-2">
          {resource.data.map((candidate) => (
            <Card key={candidate.publicNoteId}>
              <Card.Header>
                <div>
                  <Card.Title>
                    {candidate.studentName} · {candidate.title}
                  </Card.Title>
                  <Card.Description>{candidate.preview}</Card.Description>
                </div>
              </Card.Header>
              {!candidate.selected && (
                <Textarea
                  aria-label={`${candidate.title} 선정 이유`}
                  rows={3}
                  value={reason[candidate.publicNoteId] ?? ''}
                  onChange={(event) =>
                    setReason((current) => ({
                      ...current,
                      [candidate.publicNoteId]: event.target.value,
                    }))
                  }
                />
              )}
              <Card.Footer>
                <Button
                  variant={candidate.selected ? 'outlined' : 'primary'}
                  onClick={() =>
                    void toggle(candidate.publicNoteId, candidate.selected)
                  }
                >
                  {candidate.selected ? '선정 취소' : '베스트로 선정'}
                </Button>
              </Card.Footer>
            </Card>
          ))}
        </div>
      ) : (
        <Slice3Status
          title="이번 주 후보가 없어요"
          description="학생이 공개한 노트가 생기면 이곳에 보여요."
        />
      )}
    </Slice3Page>
  );
};
