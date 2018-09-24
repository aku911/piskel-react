import * as React from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import './Canvas.css';

interface ICanvasProps {
    backgroundColor: string;
    hoverColor: string;
    width: number;
    height: number;
}

interface IPixel {
    x: number;
    y: number;
    color: string | undefined;
}

interface ICanvasState {
    penColor: string;
    pixels: IPixel[];
    hoverPixel: IPixel | undefined;
    windowWidth: number;
    windowHeight: number;
}

interface IMouseEvent {
    evt: MouseEvent;
    target: any;
    currentTarget: any;
    type: string;
}

class Canvas extends React.Component<ICanvasProps, ICanvasState> {

    // Should later be able to modulate this based on zoom
    private static readonly RECT_SIZE = 10;
    private clientRect: ClientRect;
    private lastDrawPosition: {x: number, y: number} | undefined;

    private stageContainer: React.RefObject<HTMLDivElement>;

    constructor(props: ICanvasProps, state: ICanvasState) {
        super(props);
        this.state = { windowHeight: 100, windowWidth: 100, penColor: "black", pixels: [], hoverPixel: undefined };
        this.stageContainer = React.createRef();
        const actualWidth = props.width * Canvas.RECT_SIZE;
        this.clientRect = { top: 0, left: 0, right: actualWidth, bottom: actualWidth, height: actualWidth, width: actualWidth };
        this.onAdd = this.onAdd.bind(this);
        this.onRemove = this.onRemove.bind(this);
        this.drawCursor = this.drawCursor.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    public onStageContextMenu(evt: React.MouseEvent<HTMLDivElement>) {
        if (evt.stopPropagation) {
            evt.stopPropagation();
        } 
        if (evt.preventDefault) {
            evt.preventDefault();
        }
        return false;
    }

    public onRemove(e: IMouseEvent) {
        const pixel = this.getPixel(this.getMouseCoords(e));
        if (pixel) {
            // Update our state
            this.setState({...this.state, pixels: this.removePixel(pixel, this.state.pixels), hoverPixel: undefined});
        }

    }

    public onAdd(e: IMouseEvent) {
        const pixel = this.getPixel(this.getMouseCoords(e));
        if (pixel) {
            // Update our state
            this.setState({...this.state, pixels: this.addPixel(pixel, this.state.pixels), hoverPixel: undefined});
        }
    }

    public drawCursor(e: IMouseEvent){
        const pixel = this.getPixel(this.getMouseCoords(e), this.props.hoverColor);
        if (pixel) {
            // Set the hover pixel
            this.setState({...this.state, hoverPixel: pixel});
        }
    }

    public onMouseUp(e: IMouseEvent) {
        this.lastDrawPosition = undefined;
        this.drawCursor(e);
    }

    public onMouseDown(e: IMouseEvent) {
        if (e.evt.buttons === 1 || e.evt.buttons === 2) {
            this.onDrawableEvent(e);
        }
    }

    public onMouseMove(e: IMouseEvent){
        if (e.evt.buttons === 0) {
            // This means the mouse is not down, so show the hover value
            this.drawCursor(e);
        }
        else if (e.evt.buttons === 1 || e.evt.buttons === 2) {
            this.onDrawableEvent(e);
        }
    }

    public componentDidMount() {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions);
    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);
    }

    public render() {
        const actualWidth = this.props.width * Canvas.RECT_SIZE;

        return (
            // Create layout so we can center
            <div className="layout">
                <div className="stage-container" id="stage-container" ref={this.stageContainer} onContextMenu={this.onStageContextMenu}>
                    <Stage width={actualWidth} height={actualWidth}
                           onMouseDown={this.onMouseDown}
                           onMouseUp={this.onMouseUp}
                           onMouseMove={this.onMouseMove}>
                        <Layer>
                            {/* Create a special canvas rect that draws our background */}
                            <Rect
                                name="canvas_rect"
                                x={0} y={0}
                                width={actualWidth}
                                height={actualWidth}
                                fill={this.props.backgroundColor}
                            />
                        </Layer>
                        <Layer>
                            {this.renderPixels()}
                        </Layer>
                    </Stage>
                </div>
            </div>
        )
    }

    private renderPixels = () => {
        const result: any[] = [];
        if (this.state && this.state.pixels) {
            for (const key in this.state.pixels) {
                if (key && this.state.pixels[key]) {
                    const pixel = this.state.pixels[key];
                    // window.console.log(pixel);
                    result.push(
                        <Rect 
                            key={result.length} 
                            x={pixel.x * Canvas.RECT_SIZE} 
                            y={pixel.y * Canvas.RECT_SIZE} 
                            width={Canvas.RECT_SIZE} 
                            height={Canvas.RECT_SIZE} 
                            fill={this.state.penColor} />
                    )
                }
            };
        }
        if (this.state && this.state.hoverPixel && this.state.hoverPixel.color) {
            result.push(
                <Rect 
                    key={result.length} 
                    x={this.state.hoverPixel.x * Canvas.RECT_SIZE} 
                    y={this.state.hoverPixel.y * Canvas.RECT_SIZE} 
                    width={Canvas.RECT_SIZE} 
                    height={Canvas.RECT_SIZE} 
                    fill={this.state.hoverPixel.color} />
            )
        }
        return result;
    }

    private getAddOrRemoveFunc(e: IMouseEvent) {
        if (e.evt.buttons === 1) {
            return this.onAdd;
        }
        if (e.evt.buttons === 2) {
            return this.onRemove;
        }
        return undefined;
    }

    private applyLine(startPoint: IPixel, endPoint: IPixel, pixels: IPixel[], addOrRemove: boolean) {
        const modifyList = (key: string, p: IPixel, list: IPixel[]) => { addOrRemove ? list[key] = p : delete list[key]; };
        const copy = this.copyPixels(pixels);

        // Implement Bresenham's algorithm for mapping all the coords between two points
        let x1 = startPoint.x;
        const x2 = endPoint.x;
        let y1 = startPoint.y;
        const y2 = endPoint.y;
        const dx = Math.abs(endPoint.x - startPoint.x);
        const dy = Math.abs(endPoint.y - startPoint.y);
        const sx = (startPoint.x < endPoint.x) ? 1 : -1;
        const sy = (startPoint.y < endPoint.y) ? 1 : -1;
        let err = dx - dy;

        // Loop until we match x and y 
        while (x1 !== x2 || y1 !== y2) {
            
            const e2 = 2 * err;

            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }

            // Generate a new pixel and add/remove it from the list
            const pixel = {x: x1, y:y1, color: endPoint.color};
            const key = this.getPixelKey(pixel);
            modifyList(key, pixel, copy);
        }

        return copy;
    }

    private onDrawableEvent(e: IMouseEvent) {
        if (e.evt.buttons !== 0) {
            // Compute number of points (might be more than one if last mouse move is more than one away)
            const endPoint = this.getPixel(this.getMouseCoords(e));
            if (this.lastDrawPosition && endPoint &&
                (Math.abs(this.lastDrawPosition.x - endPoint.x) > 1 || Math.abs(this.lastDrawPosition.y - endPoint.y) > 1)) {
                const startPoint = {...this.lastDrawPosition, color: undefined };

                // Generate a line of points and apply to our state
                this.setState({...this.state, pixels: this.applyLine(startPoint, endPoint, this.state.pixels, e.evt.buttons === 1), hoverPixel: undefined});
            }
            else if (endPoint) {
                // We have just an end point. Just draw this
                const drawFunc = this.getAddOrRemoveFunc(e);
                if (drawFunc) {
                    drawFunc(e);
                }
            }

            // Save our last draw position in case another mouse move occurs
            if (endPoint) {
                this.lastDrawPosition = {x: endPoint.x, y: endPoint.y};
            }
        }
    }

    private getPixel(coords: { x: number, y: number } | undefined, pixelColor?: string) {
        if (coords) {
            return { x: Math.floor(coords.x / Canvas.RECT_SIZE), y: Math.floor(coords.y / Canvas.RECT_SIZE), color:pixelColor }
        }

        return undefined;
    }

    private copyPixels(pixels: IPixel[]) {
        return Object.assign({}, pixels);
    }

    private getPixelKey(p: IPixel) {
        return p.x.toString() + ":" + p.y.toString();
    }

    private removePixel(pixel: IPixel, pixels: IPixel[]) {
        const key = this.getPixelKey(pixel);
        const copy = this.copyPixels(pixels);
        delete copy[key];
        return copy;
    }

    private addPixel(pixel: IPixel, pixels: IPixel[]) {
        const key = this.getPixelKey(pixel);
        const copy = this.copyPixels(pixels);
        copy[key] = pixel;
        return copy;
    } 

    private updateDimensions() {
        if (this.stageContainer && this.stageContainer.current) {
            const boundingRect = this.stageContainer.current.getBoundingClientRect();
            this.setState({ ...this.state, windowWidth: boundingRect.width, windowHeight: boundingRect.height });
        }
    }

    private getMouseCoords(e: IMouseEvent) {
        const locx = e.evt.offsetX;
        const locy = e.evt.offsetY;
        if (locx >= 0 && locx <= this.clientRect.right && locy >= 0 && locy <= this.clientRect.bottom) {
            return {x: locx, y: locy};
        }      
        
        return undefined;
    }
}

export default Canvas;