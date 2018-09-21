import * as React from 'react';
import { Layer, Rect, Stage } from 'react-konva';
import { Point } from '../Helpers/Point'
import './Canvas.css';

interface ICanvasProps {
    backgroundColor: string;
    width: number;
    height: number;
}

interface ICanvasState {
    penColor: string;
    points: Point[];
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

    private stageContainer: React.RefObject<HTMLDivElement>;

    constructor(props: ICanvasProps, state: ICanvasState) {
        super(props);
        this.state = { windowHeight: 100, windowWidth: 100, penColor: "black", points: [] };
        this.stageContainer = React.createRef();
        const actualWidth = props.width * Canvas.RECT_SIZE;
        this.clientRect = { top: 0, left: 0, right: actualWidth, bottom: actualWidth, height: actualWidth, width: actualWidth };
        this.onAdd = this.onAdd.bind(this);
        this.onRemove = this.onRemove.bind(this);
    }

    public onRemove(e: IMouseEvent) {
        const x = e.target.attrs.x;
        const y = e.target.attrs.y;
        if (x && y) {
            const pointX = Math.floor(x / Canvas.RECT_SIZE);
            const pointY = Math.floor(y / Canvas.RECT_SIZE);

            // Update our state
            this.setState({...this.state, points: this.removePoint({x: pointX, y: pointY}, this.state.points)});
        }

    }

    public onAdd(e: IMouseEvent) {
        // Update our state and add/remove a point
        const x = e.evt.offsetX;
        const y = e.evt.offsetY;
        if (x >= 0 && x <= this.clientRect.right && y >= 0 && y <= this.clientRect.bottom) {
            // Compute point location based on x/y
            const pointX = Math.floor(x / Canvas.RECT_SIZE);
            const pointY = Math.floor(y / Canvas.RECT_SIZE);

            // Update our state
            this.setState({...this.state, points: this.addPoint({x: pointX, y: pointY}, this.state.points)});
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
                <div className="stage-container" id="stage-container" ref={this.stageContainer}>
                    <Stage width={actualWidth} height={actualWidth}>
                        <Layer>
                            {/* Create a special canvas rect that draws our background */}
                            <Rect
                                name="canvas_rect"
                                x={0} y={0}
                                width={actualWidth}
                                height={actualWidth}
                                fill={this.props.backgroundColor}
                                onClick={this.onAdd} />
                        </Layer>
                        <Layer>
                            {this.renderPoints()}
                        </Layer>
                    </Stage>
                </div>
            </div>
        )
    }

    private renderPoints = () => {
        const result: any[] = [];
        if (this.state && this.state.points) {
            for (const key in this.state.points) {
                if (key && this.state.points[key]) {
                    const point = this.state.points[key];
                    // window.console.log(point);
                    result.push(
                        <Rect 
                            key={result.length} 
                            x={point.x * Canvas.RECT_SIZE} 
                            y={point.y * Canvas.RECT_SIZE} 
                            onClick={this.onRemove}
                            width={Canvas.RECT_SIZE} 
                            height={Canvas.RECT_SIZE} 
                            fill={this.state.penColor} />
                    )
                }
            };
        }
        return result;
    }

    private copyPoints(points: Point[]) {
        return Object.assign({}, points);
    }

    private getPointKey(p: Point) {
        return p.x.toString() + ":" + p.y.toString();
    }

    private removePoint(point: Point, points: Point[]) {
        const key = this.getPointKey(point);
        const copy = this.copyPoints(points);
        delete copy[key];
        return copy;
    }

    private addPoint(point: Point, points: Point[]) {
        const key = this.getPointKey(point);
        const copy = this.copyPoints(points);
        copy[key] = point;
        return copy;
    } 

    private updateDimensions() {
        if (this.stageContainer && this.stageContainer.current) {
            const boundingRect = this.stageContainer.current.getBoundingClientRect();
            this.setState({ ...this.state, windowWidth: boundingRect.width, windowHeight: boundingRect.height });
        }
    }
}

export default Canvas;