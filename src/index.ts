import {
  AuthorizationType,
  FieldType,
  FormItemComponent,
  fieldDecoratorKit,
} from 'dingtalk-docs-cool-app';
import { executeXhsHumanizeField } from './execute';
import {
  SERVICE_ACCOUNT_INFO_URL,
  SERVICE_ALLOWED_HOSTS,
  SERVICE_AUTHORIZATION_ID,
  SERVICE_AUTHORIZATION_ICON_URL,
} from './service-config';

const { t } = fieldDecoratorKit;

fieldDecoratorKit.setDomainList([...SERVICE_ALLOWED_HOSTS]);

fieldDecoratorKit.setDecorator({
  name: '目标文章去 AI 味',
  i18nMap: {
    'zh-CN': {
      sourceTextLabel: '目标文章正文',
      intensityLabel: '处理强度',
      intensityLight: '轻度润色',
      intensityBalanced: '标准自然化',
      intensityStrong: '深度重写',
      serviceAuthLabel: 'AI 工具服务密钥',
      serviceAuthTooltip: '填写共享 AI 工具服务提供的访问密钥',
      invalidSourceText: '正文需为 50 至 8,000 个字符',
      invalidIntensity: '处理强度配置无效，请重新选择',
      serviceUnauthorized: '服务密钥无效或已失效，请重新配置',
      serviceRateLimited: '当前请求较多，请稍后重试',
      serviceQuotaExhausted: '当前服务密钥配额不足，请联系管理员',
      serviceTimeout: '本次处理超时，请重试；长文可尝试轻度模式或缩短正文',
      modelUnavailable: '模型服务暂时不可用，请稍后重试',
      invalidModelOutput: '生成结果未通过质量检查，请重新生成',
      serviceUnavailable: '去 AI 味服务暂时不可用，请稍后重试',
    },
    'en-US': {
      sourceTextLabel: 'Source article',
      intensityLabel: 'Rewrite intensity',
      intensityLight: 'Light polish',
      intensityBalanced: 'Balanced naturalization',
      intensityStrong: 'Strong rewrite',
      serviceAuthLabel: 'AI tools service key',
      serviceAuthTooltip: 'Enter the access key issued by the shared AI tools service',
      invalidSourceText: 'The source article must contain 50 to 8,000 characters.',
      invalidIntensity: 'The rewrite intensity is invalid. Select it again.',
      serviceUnauthorized: 'The service key is invalid or expired. Configure it again.',
      serviceRateLimited: 'Too many requests. Try again later.',
      serviceQuotaExhausted: 'The service key has insufficient quota. Contact an administrator.',
      serviceTimeout: 'Processing timed out. Retry, use light mode, or shorten a long article.',
      modelUnavailable: 'The model service is unavailable. Try again later.',
      invalidModelOutput: 'The generated result failed quality checks. Generate it again.',
      serviceUnavailable: 'The humanize rewrite service is unavailable. Try again later.',
    },
    'ja-JP': {
      sourceTextLabel: '対象記事の本文',
      intensityLabel: '処理の強度',
      intensityLight: '軽い調整',
      intensityBalanced: '標準的な自然化',
      intensityStrong: '大幅なリライト',
      serviceAuthLabel: 'AI ツールサービスキー',
      serviceAuthTooltip: '共有 AI ツールサービスのアクセスキーを入力してください',
      invalidSourceText: '本文は 50 文字以上 8,000 文字以下にしてください。',
      invalidIntensity: '処理の強度が無効です。もう一度選択してください。',
      serviceUnauthorized: 'サービスキーが無効または期限切れです。再設定してください。',
      serviceRateLimited: 'リクエストが集中しています。しばらくしてから再試行してください。',
      serviceQuotaExhausted: 'サービスキーの利用枠が不足しています。管理者に連絡してください。',
      serviceTimeout: '処理がタイムアウトしました。再試行するか、軽い調整を選ぶか、長い本文を短くしてください。',
      modelUnavailable: 'モデルサービスを利用できません。しばらくしてから再試行してください。',
      invalidModelOutput: '生成結果が品質チェックを通過しませんでした。もう一度生成してください。',
      serviceUnavailable: '自然化リライトサービスを利用できません。後でもう一度お試しください。',
    },
  },
  errorMessages: {
    invalidSourceText: t('invalidSourceText'),
    invalidIntensity: t('invalidIntensity'),
    serviceUnauthorized: t('serviceUnauthorized'),
    serviceRateLimited: t('serviceRateLimited'),
    serviceQuotaExhausted: t('serviceQuotaExhausted'),
    serviceTimeout: t('serviceTimeout'),
    modelUnavailable: t('modelUnavailable'),
    invalidModelOutput: t('invalidModelOutput'),
    serviceUnavailable: t('serviceUnavailable'),
  },
  authorizations: {
    id: SERVICE_AUTHORIZATION_ID,
    platform: 'XHS AI Tools',
    type: AuthorizationType.HeaderBearerToken,
    required: true,
    instructionsUrl: SERVICE_ACCOUNT_INFO_URL,
    label: t('serviceAuthLabel'),
    tooltips: t('serviceAuthTooltip'),
    icon: {
      light: SERVICE_AUTHORIZATION_ICON_URL,
      dark: SERVICE_AUTHORIZATION_ICON_URL,
    },
  },
  formItems: [
    {
      key: 'sourceText',
      label: t('sourceTextLabel'),
      component: FormItemComponent.FieldSelect,
      props: {
        mode: 'single',
        supportTypes: [FieldType.Text],
      },
      validator: { required: true },
    },
    {
      key: 'intensity',
      label: t('intensityLabel'),
      component: FormItemComponent.Radio,
      props: {
        defaultValue: 'balanced',
        options: [
          { value: 'light', label: t('intensityLight') },
          { value: 'balanced', label: t('intensityBalanced') },
          { value: 'strong', label: t('intensityStrong') },
        ],
      },
      validator: { required: true },
    },
  ],
  resultType: { type: FieldType.Text },
  execute: async (context, formData: Record<string, any>) => {
    return executeXhsHumanizeField(context, {
      sourceText: formData.sourceText,
      intensity: formData.intensity,
    });
  },
});

export default fieldDecoratorKit;
