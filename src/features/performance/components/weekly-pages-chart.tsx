import { monthDayLabel } from '@/features/app-shell/model/format';

type WeekBar = { weekStart: string; pages: number };

/**
 * 주마다 쓴 쪽 막대. 쉬어 간 주는 낮은 막대일 뿐이고 빨강·경고·"놓친 주" 표시가 없다(AC-47k).
 * 높이는 가장 많이 쓴 주를 100%로 한 비율이다(값은 막대 위 숫자로도 읽힌다).
 */
export const WeeklyPagesChart = ({ weeks }: { weeks: WeekBar[] }) => {
  if (weeks.length === 0) return null;
  const max = Math.max(...weeks.map((week) => week.pages), 1);
  return (
    <figure
      className="border-line-line1 rounded-card p-card-pad gap-block-gap flex flex-col border bg-white"
      aria-label="주마다 쓴 쪽"
    >
      <figcaption className="font-body2-heading text-text-main">
        주마다 쓴 쪽
      </figcaption>
      <ol className="gap-inline-gap-xs flex h-32 items-end">
        {weeks.map((week) => {
          const height = Math.round((week.pages / max) * 100);
          return (
            <li
              key={week.weekStart}
              className="gap-inline-gap-xs flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              title={`${monthDayLabel(week.weekStart)} 주`}
            >
              <span className="font-caption-normal text-gray-9 numeric-tabular">
                {week.pages}
              </span>
              <span
                className="min-h-0 w-full flex-1"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                >
                  <rect
                    x="0"
                    y={100 - height}
                    width="100"
                    height={height}
                    rx="4"
                    className="fill-orange-5"
                  />
                </svg>
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
};
