import * as Honeycomb from "honeycomb-grid";
import {
  log,
  isInList,
  isGameCursor,
  getInfoTileFromHex,
  toolTip
} from "./utils";
import { setupEventHandlers } from "./events";
import { emitter } from './event-bus';

type TerrainType = "Water" | "Desert" | "Wood" | "Clay" | "Sheep" | "Ore" | "Wheat";

class TextureFactory {
  private imgs;
  geTextureByName(texture: TerrainType) {
    return this.imgs[texture];
  }
  async load() {
      const [desert, water, wood, clay, sheep, ore, wheat] = await Promise.all(
        [
          TextureFactory.loadTexture("assets/desertHex.gif"),
          TextureFactory.loadTexture("assets/waterHex.gif"),
          TextureFactory.loadTexture("assets/woodHex.gif"),
          TextureFactory.loadTexture("assets/clayHex.gif"),
          TextureFactory.loadTexture("assets/sheepHex.gif"),
          TextureFactory.loadTexture("assets/oreHex.gif"),
          TextureFactory.loadTexture("assets/wheatHex.gif")
        ]
      );
      this.imgs = {
        'Desert': desert,
        'Water': water,
        'Wood': wood,
        'Clay': clay,
        'Sheep': sheep,
        'Ore': ore,
        'Wheat': wheat
      }
  }

  static async loadTexture(path): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        resolve(img);
      };
    });
  }
}

class Game {
  private graphics: null | CanvasRenderingContext2D;
  // private richText: PIXI.Text;
  // private style: PIXI.TextStyle;
  private grid: Honeycomb.Grid;
  private Grid: Honeycomb.GridFactory<Honeycomb.Hex<{ size: number }>>;
  private ROWS = 20;
  private COLUMNS = 20;
  private WIDTH = 1200;
  // private HEIGHT = 768;
  private tiles: Array<{
    x: number;
    y: number;
    terrain: string;
    sprite: HTMLImageElement;
    text: string;
  }>;
  private gridCanvas: null | HTMLCanvasElement;
  private gridGraphics: null | CanvasRenderingContext2D;
  private canvas: null | HTMLCanvasElement;
  private bgCanvas: null | HTMLCanvasElement;
  private bgGraphics: null | CanvasRenderingContext2D;
  private gameCursor: { x: number; y: number };
  // private selected: Array<Honeycomb.Hex<{ size: number }>>;
  private selectedSprite: TerrainType;
  private textureFactory: TextureFactory;
  private fogOfWar = false;

  constructor() {
    this.gridCanvas = <HTMLCanvasElement>document.getElementById('grid');
    this.gridGraphics = this.gridCanvas.getContext("2d", { alpha: false });
    const canvasEl = document.getElementById("canvas");
    this.bgCanvas = <HTMLCanvasElement>document.getElementById("background");
    this.bgGraphics = this.bgCanvas.getContext("2d");
    this.canvas = <HTMLCanvasElement>canvasEl;
    this.graphics = this.canvas?.getContext("2d");
    this.textureFactory = new TextureFactory();

    this.gameCursor = { x: 0, y: 0 };
    this.selectedSprite = "Water";
    const Hex = Honeycomb.extendHex({ size: 30 });
    this.Grid = Honeycomb.defineGrid(Hex);
    this.grid = this.Grid.rectangle({ width: this.COLUMNS, height: this.ROWS });
    this.tiles = [];

    emitter.on("selected", this.handleBoardClick.bind(this));
    emitter.on("keyup", this.handleKeyPress.bind(this));
    emitter.on("terrainSelection", this.handleTerrainSelection.bind(this));
    emitter.on("saveLevel", this.handleSaveLevel.bind(this));
    emitter.on("loadLevel", this.handleLoadLevel.bind(this));
    emitter.on("fogChecked", this.handleFogChecked.bind(this));
  }
  start() {
    this.textureFactory.load().then(() => {
      setupEventHandlers();
      log("Creating game tiles");
      log("Drawing grid");
      this.drawAddedTiles();
      this.drawGrid();
      this.drawCursorAndFog();
    });
  }
  handleBoardClick(point) {
    const { x, y } = point;
    if (x > this.WIDTH) {
      return;
    }
    const hex = this.Grid.pointToHex(x, y);
    if (!isInList(hex, this.tiles)) {
      this.tiles.push({
        x: hex.x,
        y: hex.y,
        text: "",
        terrain: this.selectedSprite,
        sprite: this.textureFactory.geTextureByName(this.selectedSprite),
      });
    } else {
      this.tiles = this.tiles.filter((t) => {
        return !(t.x === hex.x && t.y === hex.y);
      });
    }

    this.drawAddedTiles();
  }
  handleKeyPress(evt) {
    console.log(evt.key);

    // move selected
    if (evt.key === "ArrowUp") {
      this.gameCursor.y = this.gameCursor.y - 1 < 0 ? 0 : this.gameCursor.y - 1;
    } else if (evt.key === "ArrowDown") {
      this.gameCursor.y =
        this.gameCursor.y + 1 > this.ROWS - 1
          ? this.ROWS - 1
          : this.gameCursor.y + 1;
    } else if (evt.key === "ArrowLeft") {
      this.gameCursor.x = this.gameCursor.x - 1 < 0 ? 0 : this.gameCursor.x - 1;
    } else if (evt.key === "ArrowRight") {
      this.gameCursor.x =
        this.gameCursor.x + 1 > this.COLUMNS - 1
          ? this.COLUMNS - 1
          : this.gameCursor.x + 1;
    }

    const gameTile = getInfoTileFromHex(this.gameCursor, this.tiles);

    if (gameTile) {
      toolTip(`Terrain tile of type ${gameTile.terrain}`);
    } else {
      toolTip("No tile here");
    }

    this.drawCursorAndFog();
  }
  handleTerrainSelection(evt) {
    this.selectedSprite = evt.target.value;
  }
  handleSaveLevel() {
    let filename = prompt("Enter file name (.json is appended)");
    if (filename) {
      let element = document.createElement("a");
      let json = this.tiles.map((tile) => {
        return {
          x: tile.x,
          y: tile.y,
          terrain: tile.terrain,
          text: tile.text,
        };
      });

      element.setAttribute(
        "href",
        "data:application/json; charset=utf-8," + JSON.stringify(json)
      );
      element.setAttribute("download", filename);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  }
  handleLoadLevel(file) {
    let reader = new FileReader();
    reader.readAsText(file, "UTF-8");

    // here we tell the reader what to do when it's done reading...
    reader.onload = (readerEvent) => {
      if (readerEvent) {
        let content = readerEvent.target?.result;
        let json = JSON.parse("" + content);
        // clean up

        // reassign existing tiles
        this.tiles = json.map((item) => {
          return {
            x: item.x,
            y: item.y,
            text: item.text,
            terrain: item.terrain,
            sprite: this.textureFactory.geTextureByName(item.terrain),
          };
        });
        // redraw
        this.drawAddedTiles();
        this.drawCursorAndFog();
      }
    };
  }
  handleFogChecked(evt) {
    this.fogOfWar = evt.target.checked;
    this.drawCursorAndFog();
  }
  drawAddedTiles() {
    if (this.bgCanvas && this.bgGraphics) {
      this.bgGraphics.clearRect(
        0,
        0,
        this.bgCanvas.width,
        this.bgCanvas.height
      );
      this.tiles.forEach((tile) => {
        const { x, y } = tile;
        const hex = this.grid.get({ x, y });
        if (hex) {
          const point = hex?.toPoint();
          this.bgGraphics?.drawImage(tile.sprite, point.x, point.y);
        }
      });
    }
  }

  drawCursorAndFog() {
    if (this.canvas && this.graphics) {
      this.graphics.clearRect(0, 0, this.canvas.width, this.canvas.height);
      const cursorNeighbourList = [this.gameCursor, ...this.getNeighbours()];
      this.grid.forEach((hex) => {
        if (this.graphics && this.canvas) {
          const point = hex.toPoint();
          const corners = hex.corners().map((corner) => corner.add(point));
          const [firstCorner, ...otherCorners] = corners;
          const isCursor = isGameCursor(hex, this.gameCursor);
          const isCursorOrNeighbour = isInList(hex, cursorNeighbourList);
          if ((this.fogOfWar && !isCursorOrNeighbour) || isCursor) {
            this.graphics.beginPath();
            this.graphics.moveTo(firstCorner.x, firstCorner.y);
            otherCorners.forEach(({ x, y }) => this.graphics?.lineTo(x, y));
            this.graphics.lineTo(firstCorner.x, firstCorner.y);
            this.graphics.fillStyle = isCursor ? "purple" : "black";
            this.graphics.fill();
          }
        }
      });
    }
  }

  drawGrid() {
    if (this.gridCanvas && this.gridGraphics) {
      this.gridGraphics.clearRect(
        0,
        0,
        this.gridCanvas.width,
        this.gridCanvas.height
      );
      this.gridGraphics.strokeStyle = "black";
      this.grid.forEach((hex) => {
        if (this.gridGraphics && this.gridCanvas) {
          const point = hex.toPoint();
          const corners = hex.corners().map((corner) => corner.add(point));
          const [firstCorner, ...otherCorners] = corners;
          this.gridGraphics.beginPath();
          this.gridGraphics.moveTo(firstCorner.x, firstCorner.y);
          otherCorners.forEach(({ x, y }) => this.gridGraphics?.lineTo(x, y));
          this.gridGraphics.lineTo(firstCorner.x, firstCorner.y);
          this.gridGraphics.strokeStyle = "grey";
          this.gridGraphics.stroke();
        }
      });
    }
  }

  private getNeighbours(): Honeycomb.Hex<{}>[] {
    const Hex = Honeycomb.extendHex({ orientation: "pointy" });
    return this.grid.hexesInRange(Hex(this.gameCursor.x, this.gameCursor.y), 2);
  }
}

const game = new Game();
export default game;


 