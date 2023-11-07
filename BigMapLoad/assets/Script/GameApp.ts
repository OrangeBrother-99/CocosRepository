import { _decorator, assetManager, AssetManager, Component, instantiate, Node, Prefab, view, View } from 'cc';
import { MapControl } from './MapControl';
const { ccclass, property } = _decorator;

@ccclass('GameApp')
export class GameApp extends Component {
    start() {

        assetManager.loadBundle("Maps", (err, as: AssetManager.Bundle) => {
            this.EnterGame();
        });
    }

    update(deltaTime: number) {

    }

    EnterGame(): void {
        var mapAb: AssetManager.Bundle = assetManager.getBundle("Maps");

        mapAb.load("Prefabs/Map4x5", (err, data: Prefab) => {
            let ndMap: Node = instantiate(data);
            this.node.addChild(ndMap);
            const size = view.getVisibleSize();

            ndMap.setPosition(-size.width * 0.5, -size.height * 0.5);
            let mapControl = ndMap.addComponent(MapControl);
            mapControl.init(mapAb,"10005/");
            mapControl.loadMapInfo(256,22,11,5,4);
            mapControl.loadMapByPlayer(0,0);
        });


    }
}

