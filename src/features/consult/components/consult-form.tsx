'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { useSearchParams } from 'next/navigation';

import { useCreateConsultationLead } from '@/features/consult/hooks/use-consult-form';
import {
  CONSENT_VERSION,
  ConsultFormSchema,
  ConsultForm as ConsultFormValues,
  isMinorByBirthYear,
} from '@/features/consult/schema/schema';
import {
  Button,
  Checkbox,
  Form,
  Input,
  RadioGroup,
  RequiredMark,
  Textarea,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib';
import { trackLeadConversion } from '@/shared/lib/analytics';
import { mayBeUnder14ByBirthYear } from '@/shared/lib/analytics/ad-pixels';
import {
  classifyConsultationLeadError,
  handleApiError,
} from '@/shared/lib/errors';
import { zodResolver } from '@hookform/resolvers/zod';

export function ConsultForm() {
  const searchParams = useSearchParams();
  const [receiptNo, setReceiptNo] = useState<string | null>(null);

  const mutation = useCreateConsultationLead();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ConsultFormValues>({
    resolver: zodResolver(ConsultFormSchema),
    defaultValues: {
      role: 'STUDENT',
      name: '',
      contact: '',
      message: '',
      consentPrivacy: false as unknown as true,
      consentPublish: false,
    },
    mode: 'onChange',
  });

  const role = watch('role');
  const birthYear = watch('birthYear');
  const showGuardianNotice =
    isMinorByBirthYear(birthYear) && role === 'STUDENT';

  const onSubmit = (data: ConsultFormValues) => {
    mutation.mutate(
      {
        role: data.role,
        name: data.name || undefined,
        contact: data.contact,
        birthYear: data.birthYear,
        message: data.message,
        consentPrivacy: data.consentPrivacy,
        consentPublish: data.consentPublish,
        consentVersion: CONSENT_VERSION,
        source: 'home_consult_cta',
        utmSource: searchParams.get('utm_source') ?? undefined,
        utmMedium: searchParams.get('utm_medium') ?? undefined,
        utmCampaign: searchParams.get('utm_campaign') ?? undefined,
      },
      {
        onSuccess: (result) => {
          setReceiptNo(result.receiptNo);
          trackLeadConversion('consult', result.receiptNo, {
            adsAllowed: !(
              data.role === 'STUDENT' && mayBeUnder14ByBirthYear(data.birthYear)
            ),
          });
          toast.success('접수됐어요. 곧 연락드릴게요.');
        },
        onError: (error) => {
          handleApiError(error, classifyConsultationLeadError, {});
        },
      }
    );
  };

  if (receiptNo) {
    return (
      <div className="border-line-line1 flex flex-col items-center gap-2 rounded-xl border bg-white px-8 py-14 text-center">
        <p className="font-title-heading">고민이 잘 접수됐어요</p>
        <p className="font-body2-normal text-text-sub2">
          접수번호 {receiptNo} · 선생님이 직접 확인하고 순서대로 연락드려요.
        </p>
      </div>
    );
  }

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      className="border-line-line1 flex flex-col gap-8 rounded-xl border bg-white px-6 py-8 md:px-10 md:py-10"
    >
      {/* 학생 / 학부모 */}
      <Form.Item error={!!errors.role}>
        <Form.Label className="font-body1-heading">
          누가 상담을 받으시나요? <RequiredMark />
        </Form.Label>
        <RadioGroup
          className="mt-2 flex-row gap-6"
          value={role}
          onValueChange={(v) =>
            setValue('role', v as ConsultFormValues['role'], {
              shouldValidate: true,
            })
          }
        >
          <RadioGroup.Option value="STUDENT">학생 본인</RadioGroup.Option>
          <RadioGroup.Option value="PARENT">학부모</RadioGroup.Option>
        </RadioGroup>
        <Form.ErrorMessage className="text-sm">
          {errors.role?.message}
        </Form.ErrorMessage>
      </Form.Item>

      {/* 태어난 해 */}
      <Form.Item error={!!errors.birthYear}>
        <Form.Label className="font-body1-heading">
          태어난 해 <RequiredMark />
        </Form.Label>
        <Form.Control>
          <Input
            type="number"
            placeholder="예: 2010"
            {...register('birthYear', { valueAsNumber: true })}
          />
        </Form.Control>
        <Form.ErrorMessage className="text-sm">
          {errors.birthYear?.message}
        </Form.ErrorMessage>
        {showGuardianNotice && (
          <p className="text-system-warning mt-2 text-sm">
            만 14세 미만은 개인정보보호법상 보호자 동의가 필요해요. 위에서
            &quot;학부모&quot;를 선택해 대신 접수해주세요.
          </p>
        )}
      </Form.Item>

      {/* 이름(선택) */}
      <Form.Item error={!!errors.name}>
        <Form.Label className="font-body1-heading">호칭 (선택)</Form.Label>
        <Form.Control>
          <Input
            placeholder="어떻게 불러드릴까요?"
            {...register('name')}
          />
        </Form.Control>
        <Form.ErrorMessage className="text-sm">
          {errors.name?.message}
        </Form.ErrorMessage>
      </Form.Item>

      {/* 연락처 */}
      <Form.Item error={!!errors.contact}>
        <Form.Label className="font-body1-heading">
          연락처 <RequiredMark />
        </Form.Label>
        <Form.Control>
          <Input
            placeholder="휴대폰 번호 또는 이메일"
            {...register('contact')}
          />
        </Form.Control>
        <Form.ErrorMessage className="text-sm">
          {errors.contact?.message}
        </Form.ErrorMessage>
      </Form.Item>

      {/* 고민 내용 */}
      <Form.Item error={!!errors.message}>
        <Form.Label className="font-body1-heading">
          어떤 고민이 있으신가요? <RequiredMark />
        </Form.Label>
        <Form.Control>
          <Textarea
            rows={6}
            placeholder="예: 개념은 아는데 3등급에서 안 올라요. 어떻게 학습 습관을 잡아야 할지 모르겠어요."
            {...register('message')}
          />
        </Form.Control>
        <div className="mt-2 flex items-center justify-between">
          <Form.ErrorMessage className="text-sm">
            {errors.message?.message}
          </Form.ErrorMessage>
          <span className="text-text-sub2 font-label-normal">
            {watch('message')?.length ?? 0} / 1000
          </span>
        </div>
      </Form.Item>

      {/* 동의 */}
      <div className="flex flex-col gap-3">
        <Form.Item error={!!errors.consentPrivacy}>
          <Checkbox.Label className="items-start gap-3">
            <Checkbox
              checked={watch('consentPrivacy')}
              onCheckedChange={(checked) =>
                setValue('consentPrivacy', (checked === true) as true, {
                  shouldValidate: true,
                })
              }
            />
            <span
              className={cn(
                'font-body2-normal',
                errors.consentPrivacy && 'text-system-warning'
              )}
            >
              {/* ⛔ 회장 확인 필요: 개인정보 수집·이용 동의 문구 최종본 (frd-public-portal-v1 §9) */}
              (필수) 개인정보 수집·이용에 동의합니다. 접수 목적(상담 연락)
              외에는 사용하지 않으며, 상담 종료 후 일정 기간 뒤 파기됩니다.
            </span>
          </Checkbox.Label>
          <Form.ErrorMessage className="ml-9 text-sm">
            {errors.consentPrivacy?.message}
          </Form.ErrorMessage>
        </Form.Item>

        <Checkbox.Label className="items-start gap-3">
          <Checkbox
            checked={watch('consentPublish')}
            onCheckedChange={(checked) =>
              setValue('consentPublish', checked === true)
            }
          />
          <span className="font-body2-normal">
            (선택) 답변이 도움될 만하다고 판단되면, 개인정보를 지운 익명 사례로
            다른 학생·학부모에게 공개하는 데 동의합니다.
          </span>
        </Checkbox.Label>
      </div>

      <Button
        type="submit"
        size="large"
        disabled={mutation.isPending || !isValid}
      >
        {mutation.isPending ? '접수 중' : '비공개로 고민 남기기'}
      </Button>
    </Form>
  );
}
