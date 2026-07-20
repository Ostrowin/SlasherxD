import type { NetMessage, Transport } from './types';

/**
 * Transport przez BroadcastChannel — dwie (lub więcej) karty TEJ SAMEJ
 * przeglądarki gadają ze sobą bez żadnego serwera.
 *
 * To transport TESTOWY, ale nie zabawkowy: pozwala przejść cały lockstep,
 * lobby i wykrywanie desyncu na jednym komputerze, zanim dołożymy WebRTC
 * do gry przez internet. Logika gry nie widzi różnicy — interfejs ten sam.
 */
export class BroadcastTransport implements Transport {
  readonly localId: string;
  private readonly channel: BroadcastChannel;
  private handler: ((msg: NetMessage) => void) | null = null;

  constructor(channelName = 'webslasher-coop') {
    this.localId = crypto.randomUUID();
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (event: MessageEvent<NetMessage>) => {
      this.handler?.(event.data);
    };
  }

  send(msg: NetMessage): void {
    // BroadcastChannel NIE dostarcza wiadomości do własnej karty —
    // nadawca musi obsłużyć swoje dane sam (robi to LockstepSession).
    this.channel.postMessage(msg);
  }

  onMessage(handler: (msg: NetMessage) => void): void {
    this.handler = handler;
  }

  close(): void {
    this.handler = null;
    this.channel.close();
  }
}
