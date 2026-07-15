import { Container, Sprite, Text } from 'pixi.js';

export default class SkillPanel {
  public container = new Container();
  private triggerIcon = new Sprite();
  private panelContainer = new Container();
  private isPenalOpen: boolean;

  constructor() {
    this.isPenalOpen = false;
    this.panelContainer.visible = this.isPenalOpen;

    this.container.addChild(this.panelContainer);

    this.triggerIcon.on('pointerdown', () => {
      this.isPenalOpen = !this.isPenalOpen;
      this.panelContainer.visible = this.isPenalOpen;
    });
  }

  addTriggerTo(container: Container) {
    container.addChild(
      this.triggerIcon,
      new Text({
        text: '123',
        style: { fontSize: 12, fill: 0xffffff, fontWeight: 'bold' },
      }),
    );
  }
}
