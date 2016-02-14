import React from "react";

import Component from "sourcegraph/Component";
import Dispatcher from "sourcegraph/Dispatcher";
import * as DefActions from "sourcegraph/def/DefActions";
import CodeListing from "sourcegraph/code/CodeListing";
import hotLink from "sourcegraph/util/hotLink";

class ExampleView extends Component {
	reconcileState(state, props) {
		// reset examples if showing a different definition
		if (state.defURL !== props.defURL) {
			state.defURL = props.defURL;
			state.selectedIndex = 0;
			state.displayedIndex = -1;
			state.displayedExample = null;
		}

		// fix selected index if not enough examples
		state.count = props.examples.getCount(props.defURL);
		if (state.selectedIndex >= state.count) {
			state.selectedIndex = Math.max(state.count - 1, 0);
		}

		// update displayed example if example was fetched
		let example = props.examples.get(props.defURL, state.selectedIndex);
		if (example !== null) {
			state.displayedIndex = state.selectedIndex;
			state.displayedExample = example;
		}

		state.highlightedDef = props.highlightedDef;
	}

	onStateTransition(prevState, nextState) {
		if (prevState.defURL !== nextState.defURL || prevState.selectedIndex !== nextState.selectedIndex) {
			Dispatcher.asyncDispatch(new DefActions.WantExample(nextState.defURL, nextState.selectedIndex));
			Dispatcher.asyncDispatch(new DefActions.WantExample(nextState.defURL, nextState.selectedIndex + 1)); // check if there are more examples
		}
	}

	_changeExample(delta) {
		return () => {
			let newIndex = this.state.selectedIndex + delta;
			if (newIndex < 0 || newIndex >= this.state.count) {
				return;
			}
			this.setState({selectedIndex: newIndex});
		};
	}

	render() {
		let example = this.state.displayedExample;
		let loading = this.state.selectedIndex !== this.state.displayedIndex && this.state.count !== 0;
		return (
			<div className="examples">
				<div className="example">
					<header>
						{example && <span>Used in <a href={`/${example.Repo}${example.Rev ? `@${example.Rev}` : ""}/.tree/${example.File}?startline=${example.StartLine}&endline=${example.EndLine}&seldef=${this.state.defURL}`} onClick={hotLink}>{example.File}:{example.StartLine}-{example.EndLine}</a></span>}
						{loading && <i className="fa fa-spinner fa-spin"></i>}
						{this.state.count === 0 && "No examples available"}
					</header>

					<div className="body">
						{example &&
							<div style={{opacity: loading ? 0.5 : 1}}>
								<CodeListing
									contents={example.Contents}
									selectedDef={this.state.defURL}
									highlightedDef={this.state.highlightedDef} />
							</div>
						}
					</div>
					<footer>
						<div className="pull-right">{example && example.Repo}</div>
					</footer>
				</div>
				<nav className="example-navigation">
					<button className={`btn btn-default prev ${this.state.selectedIndex === 0 ? "disabled" : ""}`} onClick={this._changeExample(-1)}><i className="fa fa-arrow-left"></i></button>
					<button className={`btn btn-default next ${this.state.selectedIndex >= this.state.count - 1 ? "disabled" : ""}`} onClick={this._changeExample(+1)}><i className="fa fa-arrow-right"></i></button>
					<button className="btn btn-default all pull-right" target="_blank" href={`${this.state.defURL}/.examples`}>
						View all uses
					</button>
				</nav>
			</div>
		);
	}
}

ExampleView.propTypes = {
	defURL: React.PropTypes.string,
	examples: React.PropTypes.object,
	highlightedDef: React.PropTypes.string,
};

export default ExampleView;
