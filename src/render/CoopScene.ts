import Phaser from 'phaser';
import { CLASSES } from '../sim/classes';
import { BroadcastTransport } from '../net/broadcastTransport';
import type { LobbyMember, NetMessage, Transport } from '../net/types';
import { makeStarfield } from './textures';

/**
 * Lobby co-opu. Pierwsza karta, która wejdzie, zostaje hostem; kolejne
 * dołączają. Host rozsyła skład i startuje grę wspólnym seedem — z niego
 * wynika cały losowy świat (przeszkody, spawny, ulepszenia), więc wszyscy
 * widzą identyczną arenę bez przesyłania jej po sieci.
 *
 * Transport to na razie BroadcastChannel (karty jednej przeglądarki).
 * Wymiana na WebRTC nie ruszy tej sceny — interfejs Transport zostaje ten sam.
 */
export class CoopScene extends Phaser.Scene {
  private transport!: Transport;
  private classIndex = 0;
  private isHost = false;
  private hostId = '';
  private members: LobbyMember[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private listText!: Phaser.GameObjects.Text;
  private started = false;

  constructor() {
    super('coop');
  }

  init(data: { classIndex?: number }): void {
    this.classIndex = data.classIndex ?? 0;
  }

  create(): void {
    this.input.mouse?.disableContextMenu();
    this.started = false;
    this.members = [];
    const { width, height } = this.scale;

    makeStarfield(this, 'stars-far', 512, 260, 1337, 0.55);
    this.add.tileSprite(0, 0, width, height, 'stars-far').setOrigin(0, 0).setDepth(-3);

    this.add
      .text(width / 2, height * 0.18, 'CO-OP LOBBY', {
        fontFamily: 'monospace', fontSize: '40px', color: '#39ff14',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.18 + 40, 'open this page in another tab to join', {
        fontFamily: 'monospace', fontSize: '15px', color: '#8899aa',
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, height * 0.35, 'connecting...', {
        fontFamily: 'monospace', fontSize: '20px', color: '#ffd166',
      })
      .setOrigin(0.5);

    this.listText = this.add
      .text(width / 2, height * 0.48, '', {
        fontFamily: 'monospace', fontSize: '17px', color: '#ccddee', align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 40, 'ESC: back to class select', {
        fontFamily: 'monospace', fontSize: '14px', color: '#556677',
      })
      .setOrigin(0.5);

    this.transport = new BroadcastTransport();
    this.transport.onMessage((msg) => this.onMessage(msg));

    // Zakładamy, że jesteśmy pierwsi; jeśli ktoś już hostuje, jego roster
    // nas poprawi w ciągu milisekund.
    this.isHost = true;
    this.hostId = this.transport.localId;
    this.members = [{ id: this.transport.localId, classIndex: this.classIndex }];
    this.transport.send({ t: 'hello', id: this.transport.localId, classIndex: this.classIndex });
    this.refresh();

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => this.tryStart());
    kb.on('keydown-ESC', () => {
      this.transport.close();
      this.scene.start('class-select');
    });
    this.events.once('shutdown', () => {
      if (!this.started) this.transport.close();
    });
  }

  private onMessage(msg: NetMessage): void {
    if (msg.t === 'hello') {
      if (this.isHost) {
        if (!this.members.some((m) => m.id === msg.id)) {
          this.members.push({ id: msg.id, classIndex: msg.classIndex });
        }
        // Host jest źródłem prawdy o składzie i kolejności (= indeksach graczy).
        this.transport.send({ t: 'roster', hostId: this.hostId, members: this.members });
      } else {
        // Nowy gracz nie zna jeszcze składu — host mu odpowie.
        this.transport.send({ t: 'hello', id: this.transport.localId, classIndex: this.classIndex });
      }
      this.refresh();
      return;
    }

    if (msg.t === 'roster') {
      // Ktoś inny hostuje: oddajemy rolę, jeśli jego id jest „starsze"
      // (deterministyczne rozstrzygnięcie wyścigu dwóch kart naraz).
      if (msg.hostId !== this.transport.localId) {
        if (this.isHost && msg.hostId < this.transport.localId) this.isHost = false;
        if (!this.isHost) {
          this.hostId = msg.hostId;
          this.members = msg.members;
        }
      }
      this.refresh();
      return;
    }

    if (msg.t === 'start' && !this.started) {
      this.launch(msg.seed, msg.members);
    }
  }

  private refresh(): void {
    const role = this.isHost ? 'HOST' : 'GUEST';
    this.statusText.setText(
      this.isHost
        ? `${role} — ${this.members.length} player(s) — ENTER to start`
        : `${role} — waiting for host to start`,
    );
    this.listText.setText(
      this.members
        .map((m, i) => {
          const you = m.id === this.transport.localId ? '  <- you' : '';
          return `${i + 1}. ${CLASSES[m.classIndex].name}${you}`;
        })
        .join('\n'),
    );
  }

  private tryStart(): void {
    if (!this.isHost || this.started) return;
    // Seed z zegara HOSTA, rozesłany wszystkim — od tego momentu świat jest
    // wspólny i nikt już nie losuje niczego lokalnie.
    const seed = Date.now() >>> 0;
    this.transport.send({ t: 'start', seed, members: this.members });
    this.launch(seed, this.members);
  }

  private launch(seed: number, members: LobbyMember[]): void {
    this.started = true;
    const localIndex = members.findIndex((m) => m.id === this.transport.localId);
    this.scene.start('game', {
      classIndex: members[Math.max(0, localIndex)].classIndex,
      coop: {
        transport: this.transport,
        seed,
        localIndex: Math.max(0, localIndex),
        classIndexes: members.map((m) => m.classIndex),
      },
    });
  }
}
