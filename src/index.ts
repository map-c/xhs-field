import {
  AuthorizationType,
  FieldType,
  FormItemComponent,
  fieldDecoratorKit,
} from 'dingtalk-docs-cool-app';
import { executeXhsHumanizeField } from './execute';
import {
  SERVICE_ALLOWED_HOSTS,
  SERVICE_AUTHORIZATION_ID,
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
      serviceUnavailable: '自然化リライトサービスを利用できません。後でもう一度お試しください。',
    },
  },
  errorMessages: {
    serviceUnavailable: t('serviceUnavailable'),
  },
  authorizations: {
    id: SERVICE_AUTHORIZATION_ID,
    platform: 'XHS AI Tools',
    type: AuthorizationType.HeaderBearerToken,
    required: true,
    instructionsUrl: 'https://alidocs.dingtalk.com',
    label: t('serviceAuthLabel'),
    tooltips: t('serviceAuthTooltip'),
    icon: { light: '', dark: '' },
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
