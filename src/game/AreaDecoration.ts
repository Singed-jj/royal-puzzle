import areasData from '../data/areas.json';

export interface Decoration {
  id: string;
  name: string;
  starCost: number;
  emoji: string;
}

export interface Area {
  id: number;
  name: string;
  emoji: string;
  levels: number[];
  decorations: Decoration[];
}

export class AreaDecoration {
  private areas: Area[];
  private unlockedDecorations: Set<string>;

  constructor() {
    this.areas = areasData as Area[];
    this.unlockedDecorations = new Set();
  }

  getArea(id: number): Area | undefined {
    return this.areas.find((a) => a.id === id);
  }

  getAreaForLevel(levelId: number): Area | undefined {
    return this.areas.find((a) => a.levels.includes(levelId));
  }

  unlockDecoration(areaId: number, decoId: string): boolean {
    const area = this.getArea(areaId);
    if (!area) return false;

    const decoration = area.decorations.find((d) => d.id === decoId);
    if (!decoration) return false;

    const key = `${areaId}:${decoId}`;
    if (this.unlockedDecorations.has(key)) return false;

    this.unlockedDecorations.add(key);
    return true;
  }

  getProgress(areaId: number): { total: number; unlocked: number } {
    const area = this.getArea(areaId);
    if (!area) return { total: 0, unlocked: 0 };

    const unlocked = area.decorations.filter((d) =>
      this.unlockedDecorations.has(`${areaId}:${d.id}`)
    ).length;

    return { total: area.decorations.length, unlocked };
  }
}
