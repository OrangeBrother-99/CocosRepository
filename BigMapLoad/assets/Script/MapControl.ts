import { _decorator, AssetManager, Component, EventKeyboard, ImageAsset, input, Input, KeyCode, Sprite, SpriteFrame, UI, UITransform, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MapControl')
export class MapControl extends Component {

    private assestManager: AssetManager.Bundle = null!;
    private mapPrefix: string = null;

    private bolckSize: number = 256;
    private mapWidthSize: number = 0;
    private mapHeightSize: number = 0;
    private viewWidth: number = 0;
    private viewHeight: number = 0;

    //当前块 位置根据玩家位置换算出(默认从1,1块开始)。
    private orgMapX: number = 0;
    private orgMapY: number = 0;

    //地图数组 一次渲染的地图块组
    private mapSprites: Array<Array<Sprite>> = [];


    private initPositionY: number = 0;
    private initPositionX: number = 0;


    init(ab: AssetManager.Bundle, mapPrefix: string) {

        this.assestManager = ab;
        this.mapPrefix = mapPrefix;
    }

    loadMapInfo(bolckSize: number, mapWidthSize: number, mapHeightSize: number,
        viewWidth: number, viewHeight: number) {
        this.bolckSize = bolckSize;
        this.mapWidthSize = mapWidthSize;
        this.mapHeightSize = mapHeightSize;
        this.viewWidth = viewWidth;
        this.viewHeight = viewHeight;

        //当前地图块在 控件下的索引。因为要把图片挂到实际的组件上
        let index = 0;
        //初始化 获取当前需要显示的地图块

        for (let i = 0; i < this.viewHeight; i++) {
            //初始化每一行数组用于按序渲染图片
            let lineSprites: Array<Sprite> = [];
            for (let j = 0; j < this.viewWidth; j++) {
                const mapChildren = this.node.children[index];
                index++;
                lineSprites.push(mapChildren.getComponent(Sprite));
            }
            //再把每一行挂载到全局需要显示的地图数组
            this.mapSprites.push(lineSprites);
        }
    }

    loadMapByPlayer(playerX: number, playerY: number) {

        // 算出玩家所在块；
        this.calculPalyerOrg(playerX, playerY);
        for (let i = 0; i < this.viewHeight; i++) {
            for (let j = 0; j < this.viewWidth; j++) {
                //循环加载玩家附近的地图块
                this.loadMapByOrg(i, j);
            }
        }
    }

    //i :玩家所在区域的地图块的起点块 Y 行，
    //j :玩家所在区域的地图块的起点块 X 列，
    loadMapByOrg(i: number, j: number) {
        const mapY = this.orgMapY + i;
        const mapX = this.orgMapX + j;
        //构建地图名称,加一因为实际地图名称从1开始不是0
        const mapName = this.mapPrefix + (mapY + 1) + "_" + (mapX + 1);
        console.info(i, j, mapName);
        this.assestManager.load(mapName, (err, data: ImageAsset) => {
            this.mapSprites[i][j].spriteFrame = SpriteFrame.createWithImage(data);
        });
    }

    private offsetY: number = 0;
    private offsetX: number = 0;

    private keyBoard: EventKeyboard = null;
    private keyUp: boolean = true;
    private speed: number = 300;

    moveMap(dx: number, dy: number): void {
        var pos = this.node.getPosition();

        pos.x += dx;
        pos.y += dy;

        this.offsetX += dx;
        this.offsetY += dy;
        //上移大于一格
        if (this.offsetY <= -this.bolckSize
            && this.orgMapY + this.viewHeight < this.mapHeightSize) {
            this.orgMapY++;
            this.loadMapByMove(0, 1);
            pos.y += this.bolckSize;
            this.offsetY += this.bolckSize;
        }
        //下移大于一格
        if (this.offsetY >= 0 && this.orgMapY > 0
            && this.orgMapY - 1 + this.viewHeight < this.mapHeightSize) {
            this.orgMapY--;
            this.loadMapByMove(0, -1);
            pos.y -= this.bolckSize;
            this.offsetY -= this.bolckSize;
        }

        //右移动
        if (this.offsetX <= - this.bolckSize
            && this.orgMapX + this.viewWidth < this.mapWidthSize) {
            this.orgMapX++;
            this.loadMapByMove(1, 0);
            pos.x += this.bolckSize;
            this.offsetX += this.bolckSize;
        }

        // //左移动
        if (this.offsetX > 0
            && this.orgMapX > 0
            && this.orgMapX - 1 + this.viewWidth < this.mapWidthSize) {
            this.orgMapX--;
            this.loadMapByMove(-1, 0);
            pos.x -= this.bolckSize;
            this.offsetX -= this.bolckSize;
        }
        this.node.setPosition(pos);
    }
    loadMapByMove(x: number, y: number) {
        if (y > 0) {
            for (let i = 1; i < this.viewHeight; i++) {
                for (let j = 0; j < this.viewWidth; j++) {
                    //循环加载玩家附近的地图块
                    this.mapSprites[i - 1][j].spriteFrame = this.mapSprites[i][j].spriteFrame;
                }
            }
            for (let i = 0; i < this.viewWidth; i++) {
                this.loadMapByOrg(this.viewHeight - 1, i);
            }
        } else if (y < 0) {
            for (let i = this.viewHeight - 1; i > 0; i--) {
                for (let j = 0; j < this.viewWidth; j++) {
                    this.mapSprites[i][j].spriteFrame = this.mapSprites[i - 1][j].spriteFrame;
                }
            }
            for (let i = 0; i < this.viewWidth; i++) {
                this.loadMapByOrg(0, i);
            }

        }
        if (x > 0) {
            for (let i = 0; i < this.viewHeight; i++) {
                for (let j = 0; j < this.viewWidth - 1; j++) {
                    //  console.info(i, j, "替换为", i, j + 1);
                    this.mapSprites[i][j].spriteFrame = this.mapSprites[i][j + 1].spriteFrame;
                }
            }
            for (let i = 0; i < this.viewHeight; i++) {
                // console.info(i, this.viewWidth - 1);
                this.loadMapByOrg(i, this.viewWidth - 1);

            }
        } else if (x < 0) {
            for (let i = 0; i < this.viewHeight; i++) {
                for (let j = this.viewHeight; j > 0; j--) {
                    //  console.info(i, j, "替换为", i, j - 1);
                    this.mapSprites[i][j].spriteFrame = this.mapSprites[i][j - 1].spriteFrame;
                }
            }
            for (let i = 0; i < this.viewHeight; i++) {
                // console.info(i, 0);
                this.loadMapByOrg(i, 0);
            }
        }
    }


    onKeyDown(event: EventKeyboard) {
        this.keyBoard = event;
        this.keyUp = false;
    }
    onKeyUp(event: EventKeyboard) {
        this.keyUp = true;
    }


    calculPalyerOrg(playerY: number, playerX: number) {
        const tileX = playerX / this.bolckSize; // 计算玩家所在块的列索引
        const tileY = playerY / this.bolckSize; // 计算玩家所在块的行索引，这里的行索引是从上到下递减的

        this.orgMapX = Math.floor(tileX);
        this.orgMapY = Math.floor(tileY);
        console.info("orgMapX:" + this.orgMapX + "orgMapY:" + this.orgMapY);
    }

    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        const size = view.getVisibleSize();
        this.initPositionX = size.width / 2;
        this.initPositionY = size.height / 2;
        console.info(this.initPositionX ,this.initPositionY);

    }
    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);

    }


    protected update(dt: number): void {
        if (!this.keyUp) {
            switch (this.keyBoard.keyCode) {
                case KeyCode.NONE: break;
                case KeyCode.KEY_W:
                    if (this.orgMapY + this.viewHeight >= this.mapHeightSize) {
                        return;
                    }
                    this.moveMap(0, -this.speed * dt);
                    break;
                case KeyCode.KEY_S:
                    if (this.node.position.y >= -this.initPositionY) {
                        return;
                    }
                    this.moveMap(0, this.speed * dt);
                    break;
                case KeyCode.KEY_A:
                    // console.info(this.orgMapX, this.orgMapY, this.offsetX, this.offsetY);
                    if (this.node.position.x >= -this.initPositionX) {
                        return;
                    }
                    this.moveMap(this.speed * dt, 0);

                    break;
                case KeyCode.KEY_D:
                    if (this.orgMapX + this.viewWidth >= this.mapWidthSize) {
                        return;
                    }
                    this.moveMap(-this.speed * dt, 0);
                    break;
            }
        }

    }

}

