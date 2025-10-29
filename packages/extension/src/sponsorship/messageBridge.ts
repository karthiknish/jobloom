import { ExtensionMessageHandler } from "../components/ExtensionMessageHandler";
import type { SponsorHighlightResult } from "./highlighter";

const ACTION = "highlightSponsoredJobs";

export function registerSponsorHighlightBridge(
  highlight: () => Promise<SponsorHighlightResult>
): void {
  ExtensionMessageHandler.unregisterHandler(ACTION);
  ExtensionMessageHandler.registerHandler(ACTION, async () => {
    const result = await highlight();
    return result;
  });
}
