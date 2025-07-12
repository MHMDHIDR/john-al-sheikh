import { VapiClient } from "@vapi-ai/server-sdk";
import { env } from "@/env";

export const vapiClient = new VapiClient({ token: env.VAPI_PRIVATE_KEY });
