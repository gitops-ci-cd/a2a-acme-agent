import type { Message, TaskStatusUpdateEvent, TextPart } from '@a2a-js/sdk';
import type { AgentExecutor, ExecutionEventBus, RequestContext } from '@a2a-js/sdk/server';

export interface ExecutorContext {
  taskId: string;
  contextId: string;
  userText: string;
}

export interface ExecutorHooks {
  onRequest?: (ctx: ExecutorContext) => void;
  onSuccess?: (ctx: ExecutorContext, responseText: string, durationMs: number) => void;
  onError?: (ctx: ExecutorContext, error: unknown) => void;
}

const defaultHooks: ExecutorHooks = {
  onRequest: (ctx) => {
    console.log(`\n🔵 [Task ${ctx.taskId.substring(0, 8)}] Processing`);
    console.log(`   Context: ${ctx.contextId || 'none'}`);
    console.log(`   Message: "${ctx.userText.substring(0, 100)}${ctx.userText.length > 100 ? '...' : ''}")`);
  },
  onSuccess: (ctx, responseText, durationMs) => {
    console.log(`✅ [Task ${ctx.taskId.substring(0, 8)}] Response generated in ${durationMs}ms`);
    console.log(`   Response: "${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}")`);
  },
  onError: (ctx, error) => {
    console.error(`❌ [Task ${ctx.taskId.substring(0, 8)}] Failed:`, error);
  },
};

/**
 * Creates an AgentExecutor that handles A2A protocol boilerplate:
 * text extraction, status lifecycle, error handling.
 *
 * Supply a handler function and optional hooks for logging/observability.
 */
export function createExecutor(
  handler: (text: string) => Promise<string>,
  hooks: ExecutorHooks = defaultHooks,
): AgentExecutor {
  return {
    async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
      const { userMessage, contextId, taskId } = requestContext;

      const userText = userMessage.parts
        .filter((part): part is TextPart => part.kind === 'text')
        .map((part) => part.text)
        .join(' ');

      const ctx: ExecutorContext = { taskId, contextId, userText };

      hooks.onRequest?.(ctx);

      const workingUpdate: TaskStatusUpdateEvent = {
        kind: 'status-update',
        taskId,
        contextId,
        status: { state: 'working' },
        final: false,
      };
      eventBus.publish(workingUpdate);

      try {
        const startTime = Date.now();
        const responseText = await handler(userText);
        const durationMs = Date.now() - startTime;

        hooks.onSuccess?.(ctx, responseText, durationMs);

        const responseMessage: Message = {
          kind: 'message',
          messageId: crypto.randomUUID(),
          role: 'agent',
          parts: [{ kind: 'text', text: responseText }],
          contextId,
        };

        eventBus.publish(responseMessage);
        eventBus.finished();
      } catch (error) {
        hooks.onError?.(ctx, error);

        const failedUpdate: TaskStatusUpdateEvent = {
          kind: 'status-update',
          taskId,
          contextId,
          status: {
            state: 'failed',
            message: {
              kind: 'message',
              messageId: crypto.randomUUID(),
              role: 'agent',
              parts: [
                {
                  kind: 'text',
                  text: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
                },
              ],
              contextId,
            },
          },
          final: true,
        };
        eventBus.publish(failedUpdate);
        eventBus.finished();
      }
    },

    async cancelTask(): Promise<void> {},
  };
}
