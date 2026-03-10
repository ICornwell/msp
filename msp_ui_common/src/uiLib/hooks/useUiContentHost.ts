
//import { useEventContext } from "../contexts/UiContentContext.js";
import { useUiEventSubscriber } from "./useUiEvents.js";


export function useUiContentHost() {
//  const { publishEvent } = useEventContext();
  const {} = useUiEventSubscriber({callback: (msg) => {
    handle(msg.messageType, msg.payload);
  }, msgTypeFilter: (msg) => msg.messageType.startsWith('UiContentHost/')});

  function handle(_messageType: string, _payload: any) {
  }
}