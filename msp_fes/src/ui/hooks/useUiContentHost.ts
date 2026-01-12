
import { useEventContext } from "../contexts/UiContentContext.js";
import { useUiEventSubscriber } from "./useUiEvents";


export function useUiContentHost() {
  const { publishEvent } = useEventContext();
  const {} = useUiEventSubscriber({callback: (msg) => {
    handle(msg.messageType, msg.payload);
  }, msgTypeFilter: (msg) => msg.messageType.startsWith('UiContentHost/')});

  function handle(messageType: string, payload: any) {
  }
}