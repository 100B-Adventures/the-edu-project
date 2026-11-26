import type { ReactNode } from 'react';

import { Card } from '@/shared/components/ui/card';

type Slice3PageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export const Slice3Page = ({
  eyebrow,
  title,
  description,
  children,
}: Slice3PageProps) => (
  <main
    className="px-section-gap py-section-gap gap-block-gap mx-auto flex w-full max-w-280 flex-col"
    data-testid="mvp-h-slice3-page"
  >
    <header className="gap-content-gap flex flex-col">
      <p className="font-caption-heading text-orange-10">{eyebrow}</p>
      <h1 className="font-display3-heading text-text-main text-heading-wrap">
        {title}
      </h1>
      <p className="font-body2-normal text-gray-9 text-two-lines">
        {description}
      </p>
    </header>
    {children}
  </main>
);

export const Slice3Status = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Card data-testid="slice3-status">
    <Card.Header>
      <div>
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </div>
    </Card.Header>
  </Card>
);
