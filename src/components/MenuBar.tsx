import * as React from 'react';
import './MenuBar.css'

export interface IMenuButton {
    text: string;
    click: () => void;
}

export interface IMenuProps {
    buttons: IMenuButton[];
}

export class MenuBar extends React.Component<IMenuProps, any> {

    constructor(props: IMenuProps, state: any) {
        super(props);
    }

    public render() {

        return (
            <div className="main-bar">
            <div className="main-text">Piskel-Copy</div>
            <div className="right-bar">
            {
                    this.props && this.props.buttons && this.props.buttons.map((b: IMenuButton, i: number) => 
                        <div className="nav-bar-button" key={i} onClick={b.click}>{b.text}</div>
                    )
                }
            </div>
            </div>
        )
    }

}

export default MenuBar;