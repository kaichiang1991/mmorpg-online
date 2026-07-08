import { BASIC_ATTACK, SPEAR, Skill } from './skills';

/** Resolves a client-sent skill id to its static definition; unknown ids yield undefined. */
export class SkillFactory {
  private readonly skills = new Map<string, Skill>([BASIC_ATTACK, SPEAR].map((s) => [s.id, s]));

  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }
}
