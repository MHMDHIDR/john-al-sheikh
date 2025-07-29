import { VapiClient } from "@vapi-ai/server-sdk";
import { env } from "@/env";

export function createVapiClient(token: string) {
  return new VapiClient({ token });
}

export function getAllVapiKeysInOrder(): string[] {
  // Current key first, then previous keys in fallback order
  return [
    env.VAPI_PRIVATE_KEY,
    env.VAPI_PRIVATE_KEY_UP_TO_29_JULY,
    env.VAPI_PRIVATE_KEY_UP_TO_27_JULY,
    env.VAPI_PRIVATE_KEY_UP_TO_17_JULY,
    env.VAPI_PRIVATE_KEY_UP_TO_11_JULY,
    env.VAPI_PRIVATE_KEY_UP_TO_04_JULY,
  ].filter(Boolean);
}
