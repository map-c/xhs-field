import { describe, expect, it, vi } from 'vitest';
import { FieldExecuteCode } from 'dingtalk-docs-cool-app';
import { executeXhsHumanizeField } from '../src/execute.js';
import fieldDecoratorKit from '../src/index.js';
import {
  SERVICE_ACCOUNT_INFO_URL,
  SERVICE_AUTHORIZATION_ICON_URL,
} from '../src/service-config.js';

const sourceText = '这是一篇用于钉钉字段端到端测试的完整文章正文。'.repeat(5);

describe('xhs humanize field execute', () => {
  it('将获取账号信息链接和授权图标写入字段配置', () => {
    expect(fieldDecoratorKit.getDecorator()?.authorizations).toMatchObject({
      instructionsUrl: SERVICE_ACCOUNT_INFO_URL,
      icon: {
        light: SERVICE_AUTHORIZATION_ICON_URL,
        dark: SERVICE_AUTHORIZATION_ICON_URL,
      },
    });
  });

  it('拒绝过短正文且不调用服务', async () => {
    const fetch = vi.fn();
    const result = await executeXhsHumanizeField(
      { fetch },
      { sourceText: '正文过短', intensity: 'balanced' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.InvalidArgument,
        errorMessage: 'invalidSourceText',
      }),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('拒绝超过 8000 个字符的正文且不调用服务', async () => {
    const fetch = vi.fn();
    const result = await executeXhsHumanizeField(
      { fetch },
      { sourceText: '正文'.repeat(4_001), intensity: 'balanced' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.InvalidArgument,
        errorMessage: 'invalidSourceText',
      }),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('参数错误只报告值形态而不泄露正文', async () => {
    const fetch = vi.fn();
    const result = await executeXhsHumanizeField(
      { fetch },
      { sourceText: { value: '不应出现在错误信息中的正文' } },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.InvalidArgument,
        msg: expect.stringContaining('object(value:string)'),
      }),
    );
    expect(result).not.toEqual(
      expect.objectContaining({
        msg: expect.stringContaining('不应出现在错误信息中的正文'),
      }),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('拒绝非法强度配置', async () => {
    const fetch = vi.fn();
    const result = await executeXhsHumanizeField(
      { fetch },
      { sourceText, intensity: 'unknown' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.InvalidArgument,
        errorMessage: 'invalidIntensity',
      }),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('将服务成功响应转换为文本字段结果', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        requestId: 'request-1',
        data: { value: '这是一篇自然化改写后的正文。' },
      }),
    });
    const result = await executeXhsHumanizeField(
      { fetch },
      { sourceText, intensity: 'strong' },
    );

    expect(result).toEqual({
      code: FieldExecuteCode.Success,
      data: '这是一篇自然化改写后的正文。',
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://field.kazhilian.com/v1/tools/xhs-humanize-rewrite',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"intensity":"strong"'),
      }),
      'xhs_ai_tools_service',
    );
  });

  it('未传强度时默认使用标准自然化', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        requestId: 'request-default',
        data: { value: '这是一篇默认强度处理后的正文。' },
      }),
    });

    await executeXhsHumanizeField({ fetch }, { sourceText });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"intensity":"balanced"'),
      }),
      expect.any(String),
    );
  });

  it('兼容钉钉标题字段返回的富文本值', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        requestId: 'request-rich-text',
        data: { value: '这是一篇富文本来源处理后的正文。' },
      }),
    });

    const result = await executeXhsHumanizeField(
      { fetch },
      { sourceText: { markdown: sourceText }, intensity: 'light' },
    );

    expect(result).toEqual({
      code: FieldExecuteCode.Success,
      data: '这是一篇富文本来源处理后的正文。',
    });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('映射服务限流错误', async () => {
    const result = await executeXhsHumanizeField(
      {
        fetch: vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          json: async () => ({
            ok: false,
            requestId: 'request-2',
            error: { code: 'RATE_LIMITED' },
          }),
        }),
      },
      { sourceText, intensity: 'balanced' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.RateLimit,
        errorMessage: 'serviceRateLimited',
      }),
    );
  });

  it('映射服务鉴权错误', async () => {
    const result = await executeXhsHumanizeField(
      {
        fetch: vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({
            ok: false,
            requestId: 'request-auth',
            error: { code: 'UNAUTHORIZED' },
          }),
        }),
      },
      { sourceText, intensity: 'balanced' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.AuthorizationError,
        errorMessage: 'serviceUnauthorized',
      }),
    );
  });

  it('映射服务配额耗尽错误', async () => {
    const result = await executeXhsHumanizeField(
      {
        fetch: vi.fn().mockResolvedValue({
          ok: false,
          status: 402,
          json: async () => ({
            ok: false,
            requestId: 'request-quota',
            error: { code: 'QUOTA_EXHAUSTED' },
          }),
        }),
      },
      { sourceText, intensity: 'balanced' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.QuotaExhausted,
        errorMessage: 'serviceQuotaExhausted',
      }),
    );
  });

  it('将模型超时映射为可操作提示', async () => {
    const result = await executeXhsHumanizeField(
      {
        fetch: vi.fn().mockResolvedValue({
          ok: false,
          status: 504,
          json: async () => ({
            ok: false,
            requestId: 'request-timeout',
            error: { code: 'MODEL_TIMEOUT' },
          }),
        }),
      },
      { sourceText, intensity: 'strong' },
    );

    expect(result).toEqual({
      code: FieldExecuteCode.Error,
      errorMessage: 'serviceTimeout',
      msg: 'service status=504, code=MODEL_TIMEOUT, requestId=request-timeout',
    });
  });

  it('将模型不可用映射为独立提示', async () => {
    const result = await executeXhsHumanizeField(
      {
        fetch: vi.fn().mockResolvedValue({
          ok: false,
          status: 503,
          json: async () => ({
            ok: false,
            requestId: 'request-unavailable',
            error: { code: 'MODEL_UNAVAILABLE' },
          }),
        }),
      },
      { sourceText, intensity: 'balanced' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.Error,
        errorMessage: 'modelUnavailable',
      }),
    );
  });

  it('将模型质量校验失败映射为重新生成提示', async () => {
    const result = await executeXhsHumanizeField(
      {
        fetch: vi.fn().mockResolvedValue({
          ok: false,
          status: 502,
          json: async () => ({
            ok: false,
            requestId: 'request-invalid-output',
            error: { code: 'INVALID_MODEL_OUTPUT' },
          }),
        }),
      },
      { sourceText, intensity: 'balanced' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.Error,
        errorMessage: 'invalidModelOutput',
      }),
    );
  });

  it('拒绝结构无效的成功响应', async () => {
    const result = await executeXhsHumanizeField(
      {
        fetch: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ ok: true, requestId: 'request-invalid' }),
        }),
      },
      { sourceText, intensity: 'balanced' },
    );

    expect(result).toEqual(
      expect.objectContaining({
        code: FieldExecuteCode.Error,
        errorMessage: 'serviceUnavailable',
      }),
    );
  });

  it('将网络异常映射为服务不可用', async () => {
    const result = await executeXhsHumanizeField(
      { fetch: vi.fn().mockRejectedValue(new Error('network unavailable')) },
      { sourceText, intensity: 'balanced' },
    );

    expect(result).toEqual({
      code: FieldExecuteCode.Error,
      errorMessage: 'serviceUnavailable',
      msg: 'network unavailable',
    });
  });
});
