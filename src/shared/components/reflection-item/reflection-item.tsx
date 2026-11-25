import { cn } from '@/shared/lib';

const MOOD_LABEL = {
  TIRED: '지쳤어요',
  OKAY: '보통이에요',
  FOCUSED: '집중했어요',
} as const;

type ReflectionItemProps = {
  /** '11월 24일' 처럼 읽을 수 있는 날짜 문자열. */
  dateLabel: string;
  mood?: keyof typeof MOOD_LABEL | null;
  text?: string | null;
  className?: string;
};

/** 회고 한 줄(읽기). 긴 글은 두 줄로 줄인다. 기분은 글자로만 말하고 색으로 평가하지 않는다. */
export const ReflectionItem = ({
  dateLabel,
  mood,
  text,
  className,
}: ReflectionItemProps) => (
  <li
    className={cn(
      'border-line-line1 rounded-row px-card-pad py-content-gap gap-inline-gap flex flex-col border bg-white',
      className
    )}
  >
    <div className="gap-content-gap font-caption-normal text-gray-8 flex items-center">
      <time>{dateLabel}</time>
      {mood && <span>{MOOD_LABEL[mood]}</span>}
    </div>
    {text && (
      <p className="font-body2-normal text-text-main text-two-lines">{text}</p>
    )}
  </li>
);
