import { useRouter } from 'next/navigation';

import { InquiryPayload, inquiryKeys, repository } from '@/entities/inquiry';
import { previewKeys } from '@/entities/study-room-preview';
import { PUBLIC } from '@/shared/constants';
import { trackLeadConversion } from '@/shared/lib/analytics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * [POST] 문의 작성
 */
export function useCreateInquiry() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: InquiryPayload) => repository.createInquiry(params),
    onSuccess: (data) => {
      trackLeadConversion('inquiry', data.id);
      queryClient.invalidateQueries({
        queryKey: previewKeys.all,
      });
      queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
      router.replace(PUBLIC.INQUIRY.DETAIL(data.id));
    },
  });
}
